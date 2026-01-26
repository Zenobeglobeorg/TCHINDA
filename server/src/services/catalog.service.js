import { prisma } from '../utils/prisma.js';

const VISIBLE_PRODUCT_STATUSES = ['ACTIVE', 'PENDING'];

function safeNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeLimit(value, fallback = 20) {
  return Math.min(50, Math.max(1, Number(value) || fallback));
}

export const catalogService = {
  async listDeals(filters = {}) {
    const { limit = 12 } = filters;
    const now = new Date();
    const take = safeLimit(limit, 12);

    const promos = await prisma.promotion.findMany({
      where: {
        isActive: true,
        productId: { not: null },
        startDate: { lte: now },
        endDate: { gte: now },
        product: {
          isActive: true,
          status: { in: VISIBLE_PRODUCT_STATUSES },
        },
      },
      orderBy: [{ discountValue: 'desc' }, { createdAt: 'desc' }],
      take,
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: {
              select: {
                id: true,
                fullName: true,
                firstName: true,
                lastName: true,
                sellerProfile: { select: { shopName: true, shopLogo: true } },
              },
            },
          },
        },
      },
    });

    const deals = promos
      .filter((p) => !!p.product)
      .map((p) => {
        const product = p.product;
        const price = normalizeMoney(product.price);
        const discountValue = normalizeMoney(p.discountValue);
        const discountType = String(p.discountType || '').toUpperCase();

        let dealPrice = price;
        let discountLabel = '';
        if (discountType === 'PERCENTAGE') {
          const pct = Math.min(100, Math.max(0, discountValue));
          dealPrice = Math.max(0, price * (1 - pct / 100));
          discountLabel = `-${pct}%`;
        } else if (discountType === 'FIXED_AMOUNT') {
          dealPrice = Math.max(0, price - discountValue);
          discountLabel = `-${discountValue}`;
        }

        return {
          promotion: {
            id: p.id,
            name: p.name,
            description: p.description,
            discountType: p.discountType,
            discountValue: p.discountValue,
            startDate: p.startDate,
            endDate: p.endDate,
          },
          product,
          pricing: {
            originalPrice: price,
            dealPrice,
            currency: product.currency || 'XOF',
            discountLabel,
          },
        };
      });

    return deals;
  },

  async listCategories() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Ajouter productCount (produits visibles)
    const counts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: { in: categories.map((c) => c.id) },
        isActive: true,
        status: { in: VISIBLE_PRODUCT_STATUSES },
      },
      _count: { _all: true },
    });

    const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));

    return categories.map((c) => ({
      ...c,
      productCount: countMap.get(c.id) || 0,
    }));
  },

  async getCategoryById(categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category || !category.isActive) {
      const err = new Error('Catégorie introuvable');
      err.statusCode = 404;
      throw err;
    }

    const productCount = await prisma.product.count({
      where: {
        categoryId,
        isActive: true,
        status: { in: VISIBLE_PRODUCT_STATUSES },
      },
    });

    return { ...category, productCount };
  },

  async listProducts(filters = {}) {
    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = filters;

    const where = {
      isActive: true,
      status: { in: VISIBLE_PRODUCT_STATUSES },
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { shortDescription: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    let orderBy;
    switch (sortBy) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'popular':
        orderBy = [{ viewCount: 'desc' }, { soldCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'relevance':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLim = safeLimit(limit, 20);
    const skip = (safePage - 1) * safeLim;

    const [totalItems, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: safeLim,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true,
              sellerProfile: { select: { shopName: true, shopLogo: true } },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / safeLim));

    return {
      products,
      pagination: {
        page: safePage,
        limit: safeLim,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  },

  async getProductById(productId) {
    // Incrémenter les vues (best-effort)
    await prisma.product
      .update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            photo: true,
            sellerProfile: {
              select: {
                shopName: true,
                shopLogo: true,
                shopCountry: true,
              },
            },
          },
        },
        variants: true,
      },
    });

    if (!product || !product.isActive || !VISIBLE_PRODUCT_STATUSES.includes(product.status)) {
      const err = new Error('Produit introuvable');
      err.statusCode = 404;
      throw err;
    }

    return product;
  },

  async getProductReviews(productId) {
    // Si le produit n'existe pas, retourner 404
    const exists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists) {
      const err = new Error('Produit introuvable');
      err.statusCode = 404;
      throw err;
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    return reviews;
  },

  // Helpers used by controller (parse query safely)
  parseProductQuery(query = {}) {
    return {
      categoryId: query.categoryId || undefined,
      search: query.search || undefined,
      minPrice: safeNumber(query.minPrice),
      maxPrice: safeNumber(query.maxPrice),
      sortBy: query.sortBy || 'relevance',
      page: safeNumber(query.page) || 1,
      limit: safeNumber(query.limit) || 20,
    };
  },
};


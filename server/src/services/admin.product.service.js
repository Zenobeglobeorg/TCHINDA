import { prisma } from '../utils/prisma.js';

export const adminProductService = {
  async listPendingProducts(filters = {}) {
    const { sellerId, search, page = 1, limit = 20 } = filters;

    const where = {
      status: 'PENDING',
      isActive: true,
      ...(sellerId ? { sellerId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { shortDescription: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  },

  async approveProduct(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const err = new Error('Produit introuvable');
      err.statusCode = 404;
      throw err;
    }

    if (product.status !== 'PENDING') {
      const err = new Error('Ce produit n\'est pas en attente de validation');
      err.statusCode = 400;
      throw err;
    }

    return await prisma.product.update({
      where: { id: productId },
      data: {
        status: 'ACTIVE',
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  async rejectProduct(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const err = new Error('Produit introuvable');
      err.statusCode = 404;
      throw err;
    }

    if (product.status !== 'PENDING') {
      const err = new Error('Ce produit n\'est pas en attente de validation');
      err.statusCode = 400;
      throw err;
    }

    return await prisma.product.update({
      where: { id: productId },
      data: {
        status: 'INACTIVE',
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },
};

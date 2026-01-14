import { prisma } from '../utils/prisma.js';

/**
 * Service pour la gestion de boutique
 */
export const sellerService = {
  // ========== GESTION DE BOUTIQUE ==========
  
  /**
   * Obtenir le profil vendeur
   */
  async getSellerProfile(userId) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            fullName: true,
            photo: true,
            country: true,
            city: true,
          },
        },
        shopHours: true,
      },
    });

    if (!profile) {
      throw new Error('Profil vendeur non trouvé');
    }

    return profile;
  },

  /**
   * Mettre à jour les informations de la boutique
   */
  async updateShopInfo(userId, data) {
    const {
      shopName,
      shopDescription,
      shopLogo,
      shopBanner,
      shopAddress,
      shopPhone,
      shopEmail,
      shopCountry,
      businessRegistration,
    } = data;

    return await prisma.sellerProfile.update({
      where: { userId },
      data: {
        shopName,
        shopDescription,
        shopLogo,
        shopBanner,
        shopAddress,
        shopPhone,
        shopEmail,
        shopCountry,
        businessRegistration,
      },
      include: {
        shopHours: true,
      },
    });
  },

  /**
   * Mettre à jour les horaires de la boutique
   */
  async updateShopHours(userId, hours) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profil vendeur non trouvé');
    }

    // Créer ou mettre à jour les horaires
    return await prisma.shopHours.upsert({
      where: { sellerProfileId: profile.id },
      update: hours,
      create: {
        sellerProfileId: profile.id,
        ...hours,
      },
    });
  },

  // ========== GESTION DES PRODUITS ==========

  /**
   * Créer un produit
   */
  async createProduct(userId, productData) {
    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      currency,
      sku,
      barcode,
      stock,
      minStock,
      weight,
      dimensions,
      images,
      categoryId,
      tags,
      attributes,
      seoTitle,
      seoDescription,
      variants,
    } = productData;

    // Générer un slug unique
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const hasVariants = variants && variants.length > 0;

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        sellerId: userId,
        name,
        slug,
        description,
        shortDescription,
        price,
        compareAtPrice,
        currency: currency || 'XOF',
        sku,
        barcode,
        stock: hasVariants ? 0 : (stock || 0),
        minStock: minStock || 0,
        weight,
        dimensions,
        images: images ? JSON.parse(JSON.stringify(images)) : null,
        categoryId,
        tags: tags || [],
        attributes: attributes ? JSON.parse(JSON.stringify(attributes)) : null,
        seoTitle,
        seoDescription,
        hasVariants,
        status: 'PENDING',
      },
      include: {
        category: true,
        variants: true,
      },
    });

    // Créer les variantes si fournies
    if (hasVariants) {
      for (const variant of variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: variant.name,
            sku: variant.sku,
            barcode: variant.barcode,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: variant.stock || 0,
            minStock: variant.minStock || 0,
            weight: variant.weight,
            images: variant.images ? JSON.parse(JSON.stringify(variant.images)) : null,
            attributes: variant.attributes ? JSON.parse(JSON.stringify(variant.attributes)) : null,
          },
        });
      }
    }

    // Mettre à jour le compteur de produits du vendeur
    await prisma.sellerProfile.update({
      where: { userId },
      data: {
        totalProducts: {
          increment: 1,
        },
      },
    });

    return await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        variants: true,
      },
    });
  },

  /**
   * Mettre à jour un produit
   */
  async updateProduct(userId, productId, productData) {
    // Vérifier que le produit appartient au vendeur
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
    });

    if (!product) {
      throw new Error('Produit non trouvé ou vous n\'êtes pas autorisé à le modifier');
    }

    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      currency,
      sku,
      barcode,
      stock,
      minStock,
      weight,
      dimensions,
      images,
      categoryId,
      tags,
      attributes,
      seoTitle,
      seoDescription,
      variants,
    } = productData;

    // Mettre à jour le produit
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        shortDescription,
        price,
        compareAtPrice,
        currency,
        sku,
        barcode,
        stock,
        minStock,
        weight,
        dimensions,
        images: images ? JSON.parse(JSON.stringify(images)) : undefined,
        categoryId,
        tags,
        attributes: attributes ? JSON.parse(JSON.stringify(attributes)) : undefined,
        seoTitle,
        seoDescription,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    // Mettre à jour les variantes si fournies
    if (variants) {
      // Supprimer les anciennes variantes
      await prisma.productVariant.deleteMany({
        where: { productId },
      });

      // Créer les nouvelles variantes
      for (const variant of variants) {
        await prisma.productVariant.create({
          data: {
            productId,
            name: variant.name,
            sku: variant.sku,
            barcode: variant.barcode,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: variant.stock || 0,
            minStock: variant.minStock || 0,
            weight: variant.weight,
            images: variant.images ? JSON.parse(JSON.stringify(variant.images)) : null,
            attributes: variant.attributes ? JSON.parse(JSON.stringify(variant.attributes)) : null,
          },
        });
      }

      updatedProduct.hasVariants = variants.length > 0;
    }

    return updatedProduct;
  },

  /**
   * Supprimer un produit
   */
  async deleteProduct(userId, productId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
    });

    if (!product) {
      throw new Error('Produit non trouvé ou vous n\'êtes pas autorisé à le supprimer');
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Mettre à jour le compteur de produits
    await prisma.sellerProfile.update({
      where: { userId },
      data: {
        totalProducts: {
          decrement: 1,
        },
      },
    });

    return { message: 'Produit supprimé avec succès' };
  },

  /**
   * Obtenir tous les produits du vendeur
   */
  async getSellerProducts(userId, filters = {}) {
    const {
      status,
      isActive,
      categoryId,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const where = {
      sellerId: userId,
      ...(status && { status }),
      ...(isActive !== undefined && { isActive }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Obtenir un produit par ID
   */
  async getProductById(userId, productId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
      include: {
        category: true,
        variants: true,
        promotions: {
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    return product;
  },

  // ========== GESTION DES PROMOTIONS ==========

  /**
   * Créer une promotion
   */
  async createPromotion(userId, promotionData) {
    const {
      productId,
      name,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      code,
    } = promotionData;

    // Vérifier que le produit appartient au vendeur si spécifié
    if (productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          sellerId: userId,
        },
      });

      if (!product) {
        throw new Error('Produit non trouvé ou vous n\'êtes pas autorisé');
      }
    }

    return await prisma.promotion.create({
      data: {
        productId,
        sellerId: productId ? userId : null,
        name,
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit,
        code: code?.toUpperCase(),
      },
    });
  },

  /**
   * Obtenir les promotions du vendeur
   */
  async getPromotions(userId, filters = {}) {
    const { productId, isActive, page = 1, limit = 20 } = filters;

    const where = {
      OR: [
        { sellerId: userId },
        { product: { sellerId: userId } },
      ],
      ...(productId && { productId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.promotion.count({ where }),
    ]);

    return {
      promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Mettre à jour une promotion
   */
  async updatePromotion(userId, promotionId, promotionData) {
    // Vérifier que la promotion appartient au vendeur
    const promotion = await prisma.promotion.findFirst({
      where: {
        id: promotionId,
        OR: [
          { sellerId: userId },
          { product: { sellerId: userId } },
        ],
      },
    });

    if (!promotion) {
      throw new Error('Promotion non trouvée ou vous n\'êtes pas autorisé');
    }

    const {
      name,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      code,
      isActive,
    } = promotionData;

    return await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        name,
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        usageLimit,
        code: code?.toUpperCase(),
        isActive,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    });
  },

  /**
   * Supprimer une promotion
   */
  async deletePromotion(userId, promotionId) {
    // Vérifier que la promotion appartient au vendeur
    const promotion = await prisma.promotion.findFirst({
      where: {
        id: promotionId,
        OR: [
          { sellerId: userId },
          { product: { sellerId: userId } },
        ],
      },
    });

    if (!promotion) {
      throw new Error('Promotion non trouvée ou vous n\'êtes pas autorisé');
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return { message: 'Promotion supprimée avec succès' };
  },

  // ========== SYSTÈME DE SPONSORISATION ==========

  /**
   * Créer une sponsorisation
   */
  async createSponsorship(userId, sponsorshipData) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profil vendeur non trouvé');
    }

    const {
      productId,
      type,
      level,
      startDate,
      endDate,
      cost,
      currency,
    } = sponsorshipData;

    // Vérifier que le produit appartient au vendeur si spécifié
    if (productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          sellerId: userId,
        },
      });

      if (!product) {
        throw new Error('Produit non trouvé ou vous n\'êtes pas autorisé');
      }
    }

    return await prisma.sponsorship.create({
      data: {
        sellerProfileId: profile.id,
        productId,
        type,
        level,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        cost,
        currency: currency || 'XOF',
      },
    });
  },

  /**
   * Obtenir les sponsorisations du vendeur
   */
  async getSponsorships(userId, filters = {}) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profil vendeur non trouvé');
    }

    const { type, level, isActive, page = 1, limit = 20 } = filters;

    const where = {
      sellerProfileId: profile.id,
      ...(type && { type }),
      ...(level && { level }),
      ...(isActive !== undefined && { isActive }),
    };

    const [sponsorships, total] = await Promise.all([
      prisma.sponsorship.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sponsorship.count({ where }),
    ]);

    return {
      sponsorships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ========== GESTION DES COMMANDES ==========

  /**
   * Obtenir les commandes du vendeur
   */
  async getSellerOrders(userId, filters = {}) {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where = {
      items: {
        some: {
          product: {
            sellerId: userId,
          },
        },
      },
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          items: {
            where: {
              product: {
                sellerId: userId,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
              variant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(userId, orderId, status, trackingNumber) {
    // Vérifier que la commande contient des produits du vendeur
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              sellerId: userId,
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Commande non trouvée ou vous n\'êtes pas autorisé');
    }

    const updateData = {
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(status === 'SHIPPED' && { shippedAt: new Date() }),
      ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
    };

    return await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  },

  // ========== STATISTIQUES AVANCÉES ==========

  /**
   * Obtenir les statistiques du vendeur
   */
  async getSellerStats(userId, period = 'MONTHLY', startDate, endDate) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profil vendeur non trouvé');
    }

    // Calculer les dates si non fournies
    const now = new Date();
    let dateStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    let dateEnd = endDate ? new Date(endDate) : now;

    if (period === 'DAILY') {
      dateStart = new Date(now);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(now);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (period === 'WEEKLY') {
      const dayOfWeek = now.getDay();
      dateStart = new Date(now);
      dateStart.setDate(now.getDate() - dayOfWeek);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(dateStart);
      dateEnd.setDate(dateStart.getDate() + 6);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // Obtenir les commandes du vendeur
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId: userId,
            },
          },
        },
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        items: {
          where: {
            product: {
              sellerId: userId,
            },
          },
          include: {
            product: true,
          },
        },
      },
    });

    // Calculer les statistiques de ventes
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const sellerItems = order.items;
      const sellerTotal = sellerItems.reduce((itemSum, item) => {
        return itemSum + Number(item.total);
      }, 0);
      return sum + sellerTotal;
    }, 0);

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const productsSold = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Obtenir les statistiques de trafic (simulées - à intégrer avec un système de tracking)
    const views = await prisma.product.aggregate({
      where: {
        sellerId: userId,
      },
      _sum: {
        viewCount: true,
      },
    });

    // Obtenir les statistiques de marketing
    const sponsorships = await prisma.sponsorship.findMany({
      where: {
        sellerProfileId: profile.id,
        startDate: { lte: dateEnd },
        endDate: { gte: dateStart },
      },
    });

    const adSpend = sponsorships.reduce((sum, sp) => sum + Number(sp.cost), 0);
    const adImpressions = sponsorships.reduce((sum, sp) => sum + sp.impressions, 0);
    const adClicks = sponsorships.reduce((sum, sp) => sum + sp.clicks, 0);
    const adConversions = sponsorships.reduce((sum, sp) => sum + sp.conversions, 0);

    // Calculer le ROI
    const roi = adSpend > 0 ? ((totalRevenue - adSpend) / adSpend) * 100 : 0;

    // Calculer le taux de conversion
    const conversionRate = adClicks > 0 ? (adConversions / adClicks) * 100 : 0;

    // Obtenir les produits les plus vendus
    const topProducts = await prisma.product.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        soldCount: 'desc',
      },
      take: 10,
    });

    return {
      period,
      dateRange: {
        start: dateStart,
        end: dateEnd,
      },
      sales: {
        totalSales,
        totalRevenue,
        averageOrderValue,
        productsSold,
      },
      traffic: {
        views: views._sum.viewCount || 0,
        uniqueVisitors: 0, // À implémenter avec un système de tracking
        pageViews: views._sum.viewCount || 0,
        bounceRate: 0, // À implémenter
      },
      products: {
        total: profile.totalProducts,
        viewed: 0, // À implémenter
        sold: productsSold,
        conversionRate,
      },
      marketing: {
        adSpend,
        adImpressions,
        adClicks,
        adConversions,
        roi,
      },
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        soldCount: p.soldCount,
        revenue: 0, // À calculer depuis les commandes
      })),
    };
  },

  /**
   * Enregistrer des statistiques quotidiennes
   */
  async recordDailyStats(userId) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profil vendeur non trouvé');
    }

    const stats = await this.getSellerStats(userId, 'DAILY');

    return await prisma.sellerStats.create({
      data: {
        sellerProfileId: profile.id,
        date: new Date(),
        period: 'DAILY',
        totalSales: stats.sales.totalSales,
        totalRevenue: stats.sales.totalRevenue,
        averageOrderValue: stats.sales.averageOrderValue,
        views: stats.traffic.views,
        uniqueVisitors: stats.traffic.uniqueVisitors,
        pageViews: stats.traffic.pageViews,
        bounceRate: stats.traffic.bounceRate,
        productsViewed: stats.products.viewed,
        productsSold: stats.products.sold,
        conversionRate: stats.products.conversionRate,
        adSpend: stats.marketing.adSpend,
        adImpressions: stats.marketing.adImpressions,
        adClicks: stats.marketing.adClicks,
        adConversions: stats.marketing.adConversions,
        roi: stats.marketing.roi,
      },
    });
  },
};


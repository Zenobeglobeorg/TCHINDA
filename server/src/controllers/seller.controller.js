import { sellerService } from '../services/seller.service.js';

/**
 * Contrôleur pour les fonctionnalités vendeur
 */
export const sellerController = {
  // ========== GESTION DE BOUTIQUE ==========

  /**
   * Obtenir le profil vendeur
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await sellerService.getSellerProfile(userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mettre à jour les informations de la boutique
   */
  async updateShopInfo(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await sellerService.updateShopInfo(userId, req.body);
      res.json({
        message: 'Informations de la boutique mises à jour avec succès',
        profile,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mettre à jour les horaires de la boutique
   */
  async updateShopHours(req, res, next) {
    try {
      const userId = req.user.id;
      const hours = await sellerService.updateShopHours(userId, req.body);
      res.json({
        message: 'Horaires de la boutique mis à jour avec succès',
        hours,
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== GESTION DES PRODUITS ==========

  /**
   * Créer un produit
   */
  async createProduct(req, res, next) {
    try {
      const userId = req.user.id;
      const product = await sellerService.createProduct(userId, req.body);
      res.status(201).json({
        message: 'Produit créé avec succès',
        product,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mettre à jour un produit
   */
  async updateProduct(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const product = await sellerService.updateProduct(userId, productId, req.body);
      res.json({
        message: 'Produit mis à jour avec succès',
        product,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Supprimer un produit
   */
  async deleteProduct(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const result = await sellerService.deleteProduct(userId, productId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtenir tous les produits du vendeur
   */
  async getProducts(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        categoryId: req.query.categoryId,
        search: req.query.search,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };
      const result = await sellerService.getSellerProducts(userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtenir un produit par ID
   */
  async getProductById(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const product = await sellerService.getProductById(userId, productId);
      res.json(product);
    } catch (error) {
      next(error);
    }
  },

  // ========== GESTION DES PROMOTIONS ==========

  /**
   * Créer une promotion
   */
  async createPromotion(req, res, next) {
    try {
      const userId = req.user.id;
      const promotion = await sellerService.createPromotion(userId, req.body);
      res.status(201).json({
        message: 'Promotion créée avec succès',
        promotion,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtenir les promotions du vendeur
   */
  async getPromotions(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        productId: req.query.productId,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };
      const result = await sellerService.getPromotions(userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mettre à jour une promotion
   */
  async updatePromotion(req, res, next) {
    try {
      const userId = req.user.id;
      const { promotionId } = req.params;
      const promotion = await sellerService.updatePromotion(userId, promotionId, req.body);
      res.json({
        message: 'Promotion mise à jour avec succès',
        promotion,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Supprimer une promotion
   */
  async deletePromotion(req, res, next) {
    try {
      const userId = req.user.id;
      const { promotionId } = req.params;
      const result = await sellerService.deletePromotion(userId, promotionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // ========== SYSTÈME DE SPONSORISATION ==========

  /**
   * Créer une sponsorisation
   */
  async createSponsorship(req, res, next) {
    try {
      const userId = req.user.id;
      const sponsorship = await sellerService.createSponsorship(userId, req.body);
      res.status(201).json({
        message: 'Sponsorisation créée avec succès',
        sponsorship,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtenir les sponsorisations du vendeur
   */
  async getSponsorships(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        type: req.query.type,
        level: req.query.level,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };
      const result = await sellerService.getSponsorships(userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // ========== GESTION DES COMMANDES ==========

  /**
   * Obtenir les commandes du vendeur
   */
  async getOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };
      const result = await sellerService.getSellerOrders(userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;
      const order = await sellerService.updateOrderStatus(userId, orderId, status, trackingNumber);
      res.json({
        message: 'Statut de la commande mis à jour avec succès',
        order,
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== STATISTIQUES AVANCÉES ==========

  /**
   * Obtenir les statistiques du vendeur
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const period = req.query.period || 'MONTHLY';
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const stats = await sellerService.getSellerStats(userId, period, startDate, endDate);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Enregistrer les statistiques quotidiennes
   */
  async recordDailyStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await sellerService.recordDailyStats(userId);
      res.json({
        message: 'Statistiques enregistrées avec succès',
        stats,
      });
    } catch (error) {
      next(error);
    }
  },
};


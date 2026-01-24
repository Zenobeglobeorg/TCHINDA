import express from 'express';
import { sellerController } from '../controllers/seller.controller.js';
import { sellerUploadController } from '../controllers/seller.upload.controller.js';
import { authenticate, requireAccountType } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();

// Toutes les routes nécessitent une authentification et un compte SELLER
router.use(authenticate);
router.use(requireAccountType('SELLER'));

// ========== GESTION DE BOUTIQUE ==========
router.get('/profile', sellerController.getProfile);
router.put('/shop/info', sellerController.updateShopInfo);
router.put('/shop/hours', sellerController.updateShopHours);

// ========== GESTION DES PRODUITS ==========
router.post('/products', sellerController.createProduct);
router.get('/products', sellerController.getProducts);
router.get('/products/:productId', sellerController.getProductById);
router.put('/products/:productId', sellerController.updateProduct);
router.delete('/products/:productId', sellerController.deleteProduct);

// ========== UPLOAD IMAGES (Supabase Storage) ==========
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    const err = new Error('Seules les images sont autorisées');
    // @ts-ignore
    err.statusCode = 400;
    return cb(err);
  },
});

router.post('/uploads/images', upload.array('files', 10), sellerUploadController.uploadProductImages);

// ========== GESTION DES PROMOTIONS ==========
router.post('/promotions', sellerController.createPromotion);
router.get('/promotions', sellerController.getPromotions);
router.put('/promotions/:promotionId', sellerController.updatePromotion);
router.delete('/promotions/:promotionId', sellerController.deletePromotion);

// ========== SYSTÈME DE SPONSORISATION ==========
router.post('/sponsorships', sellerController.createSponsorship);
router.get('/sponsorships', sellerController.getSponsorships);

// ========== GESTION DES COMMANDES ==========
router.get('/orders', sellerController.getOrders);
router.put('/orders/:orderId/status', sellerController.updateOrderStatus);

// ========== STATISTIQUES AVANCÉES ==========
router.get('/stats', sellerController.getStats);
router.post('/stats/daily', sellerController.recordDailyStats);

export default router;


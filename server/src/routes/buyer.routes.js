import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as buyerController from '../controllers/buyer.controller.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Middleware pour vérifier que l'utilisateur est un acheteur
router.use((req, res, next) => {
  if (req.user.accountType !== 'BUYER') {
    return res.status(403).json({
      success: false,
      error: { message: 'Accès réservé aux acheteurs' },
    });
  }
  next();
});

// Profile routes
router.get('/profile', buyerController.getProfile);
router.put('/profile', buyerController.updateProfile);

// Address routes
router.get('/addresses', buyerController.getAddresses);
router.post('/addresses', buyerController.createAddress);
router.get('/addresses/:id', buyerController.getAddress);
router.put('/addresses/:id', buyerController.updateAddress);
router.delete('/addresses/:id', buyerController.deleteAddress);
router.put('/addresses/:id/default', buyerController.setDefaultAddress);

// Wallet routes
router.get('/wallet', buyerController.getWallet);
router.get('/wallet/transactions', buyerController.getTransactions);
router.post('/wallet/deposit', buyerController.deposit);
router.post('/wallet/withdraw', buyerController.withdraw);
router.post('/wallet/transfer', buyerController.transfer);

// Cart routes
router.get('/cart', buyerController.getCart);
router.post('/cart/items', buyerController.addToCart);
router.put('/cart/items/:id', buyerController.updateCartItem);
router.delete('/cart/items/:id', buyerController.removeFromCart);
router.delete('/cart', buyerController.clearCart);

// Wishlist routes
router.get('/wishlist', buyerController.getWishlist);
router.post('/wishlist', buyerController.addToWishlist);
router.delete('/wishlist/:id', buyerController.removeFromWishlist);

// Order routes
router.get('/orders', buyerController.getOrders);
router.get('/orders/:id', buyerController.getOrder);
router.post('/orders', buyerController.createOrder);
router.post('/orders/buy-now', buyerController.createBuyNowOrder);
router.put('/orders/:id/cancel', buyerController.cancelOrder);

// Verification routes
router.get('/verification', buyerController.getVerificationStatus);
router.post('/verification/email', buyerController.requestEmailVerification);
router.post('/verification/phone', buyerController.requestPhoneVerification);
router.post('/verification/kyc', buyerController.submitKYC);
router.get('/verification/kyc', buyerController.getKYCStatus);

// Subscription routes
router.get('/subscription', buyerController.getSubscription);
router.post('/subscription', buyerController.subscribe);
router.put('/subscription/cancel', buyerController.cancelSubscription);

export default router;



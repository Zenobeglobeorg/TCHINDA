import { prisma } from '../utils/prisma.js';
import * as buyerService from '../services/buyer.service.js';

/**
 * Get buyer profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await buyerService.getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Update buyer profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Handle file upload for photo if present
    if (req.file) {
      updateData.photo = req.file.path; // Adjust based on your file storage
    }

    const profile = await buyerService.updateProfile(userId, updateData);
    res.json({ success: true, data: profile, message: 'Profil mis à jour avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all addresses
 */
export const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await buyerService.getAddresses(userId);
    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

/**
 * Create address
 */
export const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;
    const address = await buyerService.createAddress(userId, addressData);
    res.status(201).json({ success: true, data: address, message: 'Adresse créée avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get address by ID
 */
export const getAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const address = await buyerService.getAddress(userId, addressId);
    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 */
export const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const addressData = req.body;
    const address = await buyerService.updateAddress(userId, addressId, addressData);
    res.json({ success: true, data: address, message: 'Adresse mise à jour avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    await buyerService.deleteAddress(userId, addressId);
    res.json({ success: true, message: 'Adresse supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Set default address
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    await buyerService.setDefaultAddress(userId, addressId);
    res.json({ success: true, message: 'Adresse par défaut mise à jour' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet
 */
export const getWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await buyerService.getWallet(userId);
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type, status } = req.query;
    const transactions = await buyerService.getTransactions(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      status,
    });
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

/**
 * Deposit to wallet
 */
export const deposit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'XOF', paymentMethod } = req.body;
    const transaction = await buyerService.deposit(userId, {
      amount: parseFloat(amount),
      currency,
      paymentMethod,
    });
    res.status(201).json({ success: true, data: transaction, message: 'Dépôt effectué avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw from wallet
 */
export const withdraw = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'XOF', paymentMethod } = req.body;
    const transaction = await buyerService.withdraw(userId, {
      amount: parseFloat(amount),
      currency,
      paymentMethod,
    });
    res.status(201).json({ success: true, data: transaction, message: 'Retrait effectué avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer between currencies
 */
export const transfer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fromCurrency, toCurrency, amount } = req.body;
    const result = await buyerService.transfer(userId, {
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
    });
    res.json({ success: true, data: result, message: 'Transfert effectué avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await buyerService.getCart(userId);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

/**
 * Add to cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, variantId = null } = req.body;
    const cart = await buyerService.addToCart(userId, productId, quantity, variantId);
    res.json({ success: true, data: cart, message: 'Article ajouté au panier' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;
    const cart = await buyerService.updateCartItem(userId, itemId, quantity);
    res.json({ success: true, data: cart, message: 'Panier mis à jour' });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove from cart
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const cart = await buyerService.removeFromCart(userId, itemId);
    res.json({ success: true, data: cart, message: 'Article retiré du panier' });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await buyerService.clearCart(userId);
    res.json({ success: true, message: 'Panier vidé' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await buyerService.getWishlist(userId);
    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

/**
 * Add to wishlist
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    const wishlistItem = await buyerService.addToWishlist(userId, productId);
    res.status(201).json({ success: true, data: wishlistItem, message: 'Ajouté à la liste de souhaits' });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove from wishlist
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    await buyerService.removeFromWishlist(userId, itemId);
    res.json({ success: true, message: 'Retiré de la liste de souhaits' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;
    const orders = await buyerService.getOrders(userId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
export const getOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    const order = await buyerService.getOrder(userId, orderId);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * Create order
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;
    const order = await buyerService.createOrder(userId, orderData);
    res.status(201).json({ success: true, data: order, message: 'Commande créée avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a "buy now" order (single item) without touching cart
 */
export const createBuyNowOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;
    const order = await buyerService.createBuyNowOrder(userId, orderData);
    res.status(201).json({ success: true, data: order, message: 'Commande créée avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    const order = await buyerService.cancelOrder(userId, orderId);
    res.json({ success: true, data: order, message: 'Commande annulée' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification status
 */
export const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = await buyerService.getVerificationStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * Request email verification
 */
export const requestEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await buyerService.requestEmailVerification(userId);
    res.json({ success: true, message: 'Code de vérification envoyé par email' });
  } catch (error) {
    next(error);
  }
};

/**
 * Request phone verification
 */
export const requestPhoneVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await buyerService.requestPhoneVerification(userId);
    res.json({ success: true, message: 'Code de vérification envoyé par SMS' });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit KYC
 */
export const submitKYC = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const kycData = req.body;
    
    // Handle file uploads if present
    if (req.files) {
      if (req.files.documentFront) kycData.documentFront = req.files.documentFront[0].path;
      if (req.files.documentBack) kycData.documentBack = req.files.documentBack[0].path;
      if (req.files.selfie) kycData.selfie = req.files.selfie[0].path;
    }

    const verification = await buyerService.submitKYC(userId, kycData);
    res.status(201).json({ success: true, data: verification, message: 'KYC soumis avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get KYC status
 */
export const getKYCStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = await buyerService.getKYCStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription
 */
export const getSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = await buyerService.getSubscription(userId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

/**
 * Subscribe
 */
export const subscribe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subscriptionType } = req.body;
    const subscription = await buyerService.subscribe(userId, subscriptionType);
    res.json({ success: true, data: subscription, message: 'Abonnement activé avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await buyerService.cancelSubscription(userId);
    res.json({ success: true, message: 'Abonnement annulé' });
  } catch (error) {
    next(error);
  }
};



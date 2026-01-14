import express from 'express';
import { authenticate, requireAccountType } from '../middleware/auth.middleware.js';
import {
  deposit,
  withdraw,
  searchUsers,
  getUserTransactionsController,
  getStats,
} from '../controllers/commercial.controller.js';

const router = express.Router();

// Toutes les routes commercial nécessitent une authentification + un compte COMMERCIAL
router.use(authenticate);
router.use(requireAccountType('COMMERCIAL'));

/**
 * @route   POST /api/commercial/deposit
 * @desc    Effectuer un dépôt pour un utilisateur
 * @access  Private (COMMERCIAL)
 */
router.post('/deposit', deposit);

/**
 * @route   POST /api/commercial/withdraw
 * @desc    Effectuer un retrait pour un utilisateur
 * @access  Private (COMMERCIAL)
 */
router.post('/withdraw', withdraw);

/**
 * @route   GET /api/commercial/users/search
 * @desc    Rechercher un utilisateur
 * @access  Private (COMMERCIAL)
 */
router.get('/users/search', searchUsers);

/**
 * @route   GET /api/commercial/users/:userId/transactions
 * @desc    Obtenir les transactions d'un utilisateur
 * @access  Private (COMMERCIAL)
 */
router.get('/users/:userId/transactions', getUserTransactionsController);

/**
 * @route   GET /api/commercial/stats
 * @desc    Obtenir les statistiques du commercial
 * @access  Private (COMMERCIAL)
 */
router.get('/stats', getStats);

export default router;

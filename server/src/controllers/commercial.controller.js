import {
  depositForUser,
  withdrawForUser,
  getUserTransactions,
  searchUser,
  getCommercialStats,
} from '../services/commercial.service.js';

/**
 * @route   POST /api/commercial/deposit
 * @desc    Effectuer un dépôt pour un utilisateur
 * @access  Private (COMMERCIAL)
 */
export const deposit = async (req, res, next) => {
  try {
    const commercialId = req.user.id;
    const { userId, amount, currency = 'XOF', paymentMethod, description } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID utilisateur et montant sont requis' },
      });
    }

    const transaction = await depositForUser(commercialId, userId, {
      amount: parseFloat(amount),
      currency,
      paymentMethod,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Dépôt effectué avec succès',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/commercial/withdraw
 * @desc    Effectuer un retrait pour un utilisateur
 * @access  Private (COMMERCIAL)
 */
export const withdraw = async (req, res, next) => {
  try {
    const commercialId = req.user.id;
    const { userId, amount, currency = 'XOF', paymentMethod, description } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID utilisateur et montant sont requis' },
      });
    }

    const transaction = await withdrawForUser(commercialId, userId, {
      amount: parseFloat(amount),
      currency,
      paymentMethod,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Retrait effectué avec succès',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/commercial/users/search
 * @desc    Rechercher un utilisateur
 * @access  Private (COMMERCIAL)
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'La recherche doit contenir au moins 2 caractères' },
      });
    }

    const users = await searchUser(q);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/commercial/users/:userId/transactions
 * @desc    Obtenir les transactions d'un utilisateur
 * @access  Private (COMMERCIAL)
 */
export const getUserTransactionsController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const transactions = await getUserTransactions(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/commercial/stats
 * @desc    Obtenir les statistiques du commercial
 * @access  Private (COMMERCIAL)
 */
export const getStats = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;
    const commercialId = req.user.id;

    const stats = await getCommercialStats(commercialId, period);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

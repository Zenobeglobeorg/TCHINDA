import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { changeAccountTypeController, revertToBuyerController } from '../controllers/user.controller.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Obtenir le profil de l'utilisateur
 * @access  Private
 */
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour le profil de l'utilisateur
 * @access  Private
 */
router.put('/profile', (req, res) => {
  // TODO: Implémenter la mise à jour du profil
  res.json({
    success: true,
    message: 'Mise à jour du profil (à implémenter)',
  });
});

/**
 * @route   PUT /api/users/account-type
 * @desc    Changer le type de compte (BUYER -> SELLER)
 * @access  Private
 */
router.put('/account-type', changeAccountTypeController);

/**
 * @route   POST /api/users/revert-to-buyer
 * @desc    Revenir de SELLER à BUYER
 * @access  Private
 */
router.post('/revert-to-buyer', revertToBuyerController);

export default router;




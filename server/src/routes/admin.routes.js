import express from 'express';
import { authenticate, requireAccountType } from '../middleware/auth.middleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  createUser,
} from '../controllers/admin.controller.js';
import {
  listVerifications,
  approveVerification,
  rejectVerification,
} from '../controllers/admin.verification.controller.js';
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  toggleAdminCategoryActive,
} from '../controllers/admin.category.controller.js';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification + un compte ADMIN
router.use(authenticate);
router.use(requireAccountType('ADMIN'));

/**
 * @route   POST /api/admin/users
 * @desc    Créer un nouvel utilisateur
 * @access  Private (ADMIN)
 */
router.post('/users', createUser);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Obtenir les détails d'un utilisateur
 * @access  Private (ADMIN)
 */
router.get('/users/:id', getUserById);

/**
 * @route   GET /api/admin/users
 * @desc    Lister tous les utilisateurs
 * @access  Private (ADMIN)
 */
router.get('/users', getAllUsers);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (ADMIN)
 */
router.put('/users/:id', updateUser);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Changer le statut d'un utilisateur
 * @access  Private (ADMIN)
 */
router.put('/users/:id/status', updateUserStatus);

/**
 * @route   GET /api/admin/verifications
 * @desc    Lister les vérifications (ex: KYC) - filtrable via query (status/method/userId)
 * @access  Private (ADMIN)
 */
router.get('/verifications', listVerifications);

/**
 * @route   POST /api/admin/verifications/:id/approve
 * @desc    Approuver une vérification
 * @access  Private (ADMIN)
 */
router.post('/verifications/:id/approve', approveVerification);

/**
 * @route   POST /api/admin/verifications/:id/reject
 * @desc    Rejeter une vérification
 * @access  Private (ADMIN)
 */
router.post('/verifications/:id/reject', rejectVerification);

/**
 * @route   GET /api/admin/categories
 * @desc    Lister les catégories (admin)
 * @access  Private (ADMIN)
 */
router.get('/categories', listAdminCategories);

/**
 * @route   POST /api/admin/categories
 * @desc    Créer une catégorie
 * @access  Private (ADMIN)
 */
router.post('/categories', createAdminCategory);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Mettre à jour une catégorie
 * @access  Private (ADMIN)
 */
router.put('/categories/:id', updateAdminCategory);

/**
 * @route   PATCH /api/admin/categories/:id/toggle-active
 * @desc    Activer/Désactiver une catégorie
 * @access  Private (ADMIN)
 */
router.patch('/categories/:id/toggle-active', toggleAdminCategoryActive);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Supprimer une catégorie
 * @access  Private (ADMIN)
 */
router.delete('/categories/:id', deleteAdminCategory);

export default router;


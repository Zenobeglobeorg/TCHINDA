import express from 'express';
import { authenticate, requireAccountType } from '../middleware/auth.middleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  createUser,
} from '../controllers/admin.controller.js';

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

export default router;


import express from 'express';
import { authenticate, requireAccountType } from '../middleware/auth.middleware.js';
import { getAllUsers } from '../controllers/admin.controller.js';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification + un compte ADMIN
router.use(authenticate);
router.use(requireAccountType('ADMIN'));

/**
 * @route   GET /api/admin/users
 * @desc    Lister tous les utilisateurs
 * @access  Private (ADMIN)
 */
router.get('/users', getAllUsers);

export default router;


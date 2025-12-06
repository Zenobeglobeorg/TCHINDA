import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  verifyPhone,
  sendVerificationEmail,
  sendVerificationSMS,
  forgotPassword,
  resetPasswordController,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  verifyPhoneValidation,
  validate,
} from '../utils/validation.utils.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', registerValidation, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', loginValidation, validate, login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion d'un utilisateur
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/verify/email
 * @desc    Vérifier l'email avec un code
 * @access  Public
 */
router.post('/verify/email', verifyEmailValidation, validate, verifyEmail);

/**
 * @route   POST /api/auth/verify/phone
 * @desc    Vérifier le téléphone avec un code
 * @access  Public
 */
router.post('/verify/phone', verifyPhoneValidation, validate, verifyPhone);

/**
 * @route   POST /api/auth/send-verification-email
 * @desc    Envoyer un code de vérification par email
 * @access  Public
 */
router.post('/send-verification-email', sendVerificationEmail);

/**
 * @route   POST /api/auth/send-verification-sms
 * @desc    Envoyer un code de vérification par SMS
 * @access  Public
 */
router.post('/send-verification-sms', sendVerificationSMS);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demander une réinitialisation de mot de passe
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialiser le mot de passe avec un token
 * @access  Public
 */
router.post('/reset-password', resetPasswordController);

export default router;



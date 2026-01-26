import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  requestLoginOtpController,
  loginWithOtpController,
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
import {
  googleLogin,
  facebookLogin,
  appleLogin,
} from '../controllers/oauth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  verifyPhoneValidation,
  validate,
} from '../utils/validation.utils.js';

const router = express.Router();

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par 15 minutes
  message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les succès
});

// Rate limiting pour refresh token
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 tentatives par 15 minutes
  message: 'Trop de tentatives de rafraîchissement de token.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', authLimiter, registerValidation, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, validate, login);

/**
 * @route   POST /api/auth/login-otp/request
 * @desc    Demander un code OTP de connexion (email)
 * @access  Public
 */
router.post('/login-otp/request', authLimiter, requestLoginOtpController);

/**
 * @route   POST /api/auth/login-otp/verify
 * @desc    Vérifier le code OTP et connecter
 * @access  Public
 */
router.post('/login-otp/verify', authLimiter, loginWithOtpController);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post('/refresh-token', refreshLimiter, refreshToken);

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

/**
 * @route   POST /api/auth/google
 * @desc    Connexion avec Google
 * @access  Public
 */
router.post('/google', googleLogin);

/**
 * @route   POST /api/auth/facebook
 * @desc    Connexion avec Facebook
 * @access  Public
 */
router.post('/facebook', facebookLogin);

/**
 * @route   POST /api/auth/apple
 * @desc    Connexion avec Apple
 * @access  Public
 */
router.post('/apple', appleLogin);

export default router;



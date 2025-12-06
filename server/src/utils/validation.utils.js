import { body, validationResult } from 'express-validator';

/**
 * Middleware pour valider les résultats de validation
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Erreurs de validation',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * Règles de validation pour l'inscription
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial'),
  body('accountType')
    .isIn(['BUYER', 'SELLER', 'COMMERCIAL'])
    .withMessage('Type de compte invalide'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Numéro de téléphone invalide'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Code pays invalide (2 lettres)'),
];

/**
 * Règles de validation pour la connexion
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
];

/**
 * Règles de validation pour la vérification email
 */
export const verifyEmailValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Code de vérification invalide')
    .isNumeric()
    .withMessage('Le code doit être numérique'),
];

/**
 * Règles de validation pour la vérification téléphone
 */
export const verifyPhoneValidation = [
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Numéro de téléphone invalide'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Code de vérification invalide')
    .isNumeric()
    .withMessage('Le code doit être numérique'),
];




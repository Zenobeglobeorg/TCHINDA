import {
  registerUser,
  loginUser,
  refreshTokenService,
  logoutUser,
  verifyEmail as verifyEmailService,
  verifyPhone as verifyPhoneService,
  sendEmailVerificationCode,
  sendPhoneVerificationCode,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service.js';

/**
 * Contrôleur d'inscription
 */
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur de connexion
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: result,
    });
  } catch (error) {
    // Utiliser le middleware d'erreur global pour cohérence
    next(error);
  }
};

/**
 * Contrôleur de rafraîchissement de token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token requis' },
      });
    }

    const result = await refreshTokenService(token);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Contrôleur de déconnexion
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await logoutUser(token);
    }

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour obtenir l'utilisateur actuel
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;

    res.status(200).json({
      success: true,
      // Retourner directement l'utilisateur (format attendu par le client)
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur de vérification d'email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await verifyEmailService(email, code);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Contrôleur de vérification de téléphone
 */
export const verifyPhone = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    const result = await verifyPhoneService(phone, code);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Contrôleur pour envoyer un code de vérification par email
 */
export const sendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email requis' },
      });
    }

    const result = await sendEmailVerificationCode(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Contrôleur pour envoyer un code de vérification par SMS
 */
export const sendVerificationSMS = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Numéro de téléphone requis' },
      });
    }

    const result = await sendPhoneVerificationCode(phone);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Contrôleur pour oublier le mot de passe
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email requis' },
      });
    }

    const result = await requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Contrôleur pour réinitialiser le mot de passe
 */
export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token et nouveau mot de passe requis' },
      });
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le mot de passe doit contenir au moins 8 caractères' },
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial',
        },
      });
    }

    const result = await resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};



import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

/**
 * Middleware pour vérifier l'authentification JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token d\'authentification manquant' },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        adminProfile: true,
        moderatorProfile: true,
        accountantProfile: true,
        deliveryProfile: true,
        commercialProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Utilisateur non trouvé' },
      });
    }

    // Check if account is active
    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: {
          message: `Compte ${user.accountStatus.toLowerCase()}. Accès refusé.`,
        },
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.accountType = user.accountType;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Token invalide' },
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Token expiré' },
      });
    }
    next(error);
  }
};

/**
 * Middleware pour vérifier le type de compte
 */
export const requireAccountType = (...accountTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentification requise' },
      });
    }

    if (!accountTypes.includes(req.user.accountType)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Accès refusé. Type de compte requis: ${accountTypes.join(', ')}`,
        },
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier la vérification KYC
 */
export const requireKYC = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentification requise' },
      });
    }

    if (!req.user.kycVerified) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Vérification KYC requise pour cette action',
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pour vérifier l'abonnement premium (pour acheteurs)
 */
export const requireSubscription = (subscriptionType = 'GOLD') => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.accountType !== 'BUYER') {
        return res.status(403).json({
          success: false,
          error: { message: 'Cette fonctionnalité est réservée aux acheteurs' },
        });
      }

      if (req.user.subscriptionType === 'FREE') {
        return res.status(403).json({
          success: false,
          error: {
            message: `Abonnement ${subscriptionType} requis pour cette fonctionnalité`,
          },
        });
      }

      // Check if subscription is still valid
      if (req.user.subscriptionEnd && new Date(req.user.subscriptionEnd) < new Date()) {
        return res.status(403).json({
          success: false,
          error: { message: 'Votre abonnement a expiré' },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};




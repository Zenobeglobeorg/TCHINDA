import { prisma } from '../utils/prisma.js';
import crypto from 'crypto';
import { hashPassword } from '../utils/password.utils.js';
import { sendPasswordResetEmail } from './email.service.js';

// Durée de validité du token (1 heure)
const TOKEN_EXPIRY_HOURS = 1;

/**
 * Génère un token de réinitialisation sécurisé
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Crée un token de réinitialisation de mot de passe
 */
export const createPasswordResetToken = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Ne pas révéler si l'email existe ou non (sécurité)
    return { success: true, emailSent: null }; // null = email n'existe pas, donc pas d'envoi
  }

  // Supprimer les anciens tokens non utilisés
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      used: false,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Envoyer l'email de réinitialisation
  try {
    const emailResult = await sendPasswordResetEmail(user.email, token, user.firstName);
    if (emailResult && emailResult.success && !emailResult.testMode) {
      console.log(`✅ Email de réinitialisation envoyé à ${user.email}`);
      return { success: true, emailSent: true };
    } else if (emailResult && emailResult.testMode) {
      console.warn(`⚠️  Mode test: Email non envoyé réellement à ${user.email} (configuration email manquante)`);
      return { success: true, emailSent: false, error: 'Configuration email non disponible (mode test)' };
    } else {
      console.error(`❌ Échec de l'envoi de l'email à ${user.email}`);
      return { success: true, emailSent: false, error: 'Échec de l\'envoi de l\'email' };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email à ${user.email}:`, error.message || error);
    console.error('Détails de l\'erreur:', error);
    // Le token est créé, donc on retourne success mais on indique que l'email n'a pas été envoyé
    return { success: true, emailSent: false, error: error.message || 'Erreur lors de l\'envoi de l\'email' };
  }
};

/**
 * Vérifie et utilise un token de réinitialisation
 */
export const verifyPasswordResetToken = async (token) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    throw new Error('Token de réinitialisation invalide');
  }

  if (resetToken.used) {
    throw new Error('Ce token a déjà été utilisé');
  }

  if (new Date(resetToken.expiresAt) < new Date()) {
    throw new Error('Token de réinitialisation expiré');
  }

  return resetToken;
};

/**
 * Réinitialise le mot de passe avec un token
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  const resetToken = await verifyPasswordResetToken(token);

  // Hasher le nouveau mot de passe
  const hashedPassword = await hashPassword(newPassword);

  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: {
      password: hashedPassword,
      loginAttempts: 0, // Réinitialiser les tentatives de connexion
      lockedUntil: null,
    },
  });

  // Marquer le token comme utilisé
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  // Révoquer tous les refresh tokens existants (sécurité)
  await prisma.refreshToken.updateMany({
    where: {
      userId: resetToken.userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });

  return { success: true, message: 'Mot de passe réinitialisé avec succès' };
};

/**
 * Nettoie les tokens expirés (à appeler périodiquement)
 */
export const cleanExpiredTokens = async () => {
  const deleted = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true },
      ],
    },
  });

  return deleted.count;
};



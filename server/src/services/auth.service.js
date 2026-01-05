import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.utils.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.utils.js';
import { sendWelcomeEmail, sendVerificationCodeEmail } from './email.service.js';
import { sendVerificationCodeSMS } from './sms.service.js';
import { 
  createEmailVerificationCode, 
  createPhoneVerificationCode,
  verifyCode 
} from './verification-code.service.js';
import { createPasswordResetToken, resetPasswordWithToken } from './password-reset.service.js';

const prisma = new PrismaClient();

/**
 * Service d'inscription
 */
export const registerUser = async (userData) => {
  const {
    email,
    password,
    accountType,
    firstName,
    lastName,
    phone,
    country,
  } = userData;

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Cet email est déjà utilisé');
  }

  // Vérifier si le téléphone existe déjà (si fourni)
  if (phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      throw new Error('Ce numéro de téléphone est déjà utilisé');
    }
  }

  // Hasher le mot de passe
  const hashedPassword = await hashPassword(password);

  // Créer le nom complet
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      accountType,
      firstName,
      lastName,
      fullName,
      phone,
      country,
      accountStatus: accountType === 'COMMERCIAL' ? 'PENDING_VERIFICATION' : 'ACTIVE',
    },
  });

  // Créer le profil spécifique selon le type de compte
  let profile = null;
  switch (accountType) {
    case 'BUYER':
      profile = await prisma.buyerProfile.create({
        data: { userId: user.id },
      });
      // Créer le portefeuille pour l'acheteur
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
        },
      });
      break;

    case 'SELLER':
      profile = await prisma.sellerProfile.create({
        data: { userId: user.id },
      });
      // Créer le portefeuille pour le vendeur
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
        },
      });
      break;

    case 'COMMERCIAL':
      // Générer un code agent unique
      const agentCode = `AG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      profile = await prisma.commercialProfile.create({
        data: {
          userId: user.id,
          agentCode,
        },
      });
      break;

    default:
      break;
  }

  // Générer les tokens
  const token = generateToken(user.id, user.accountType, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // Sauvegarder le refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });

  // Envoyer un email de bienvenue (en arrière-plan, ne pas bloquer)
  sendWelcomeEmail(user.email, user.firstName).catch(err => {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', err);
  });

  // Retourner l'utilisateur sans le mot de passe
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: {
      ...userWithoutPassword,
      profile,
    },
    token,
    refreshToken,
  };
};

/**
 * Service de connexion
 */
export const loginUser = async (email, password) => {
  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
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
    throw new Error('Email ou mot de passe incorrect');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    // Incrémenter les tentatives de connexion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: user.loginAttempts + 1,
        lockedUntil:
          user.loginAttempts >= 4
            ? new Date(Date.now() + 30 * 60 * 1000) // Blocage 30 minutes
            : null,
      },
    });

    throw new Error('Email ou mot de passe incorrect');
  }

  // Vérifier si le compte est verrouillé
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(user.lockedUntil) - new Date()) / 60000
    );
    throw new Error(
      `Compte verrouillé. Réessayez dans ${minutesLeft} minute(s).`
    );
  }

  // Réinitialiser les tentatives de connexion
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    },
  });

  // Générer les tokens
  const token = generateToken(user.id, user.accountType, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // Sauvegarder le refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });

  // Retourner l'utilisateur sans le mot de passe
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

/**
 * Service de rafraîchissement de token
 */
export const refreshTokenService = async (refreshToken) => {
  // Vérifier le refresh token dans la base de données
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.isRevoked) {
    throw new Error('Refresh token invalide');
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    throw new Error('Refresh token expiré');
  }

  // Générer un nouveau token
  const newToken = generateToken(
    tokenRecord.userId,
    tokenRecord.user.accountType,
    tokenRecord.user.email
  );

  return { token: newToken };
};

/**
 * Service de déconnexion
 */
export const logoutUser = async (refreshToken) => {
  // Révoquer le refresh token
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });

  return { message: 'Déconnexion réussie' };
};

/**
 * Service d'envoi de code de vérification email
 */
export const sendEmailVerificationCode = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (user.emailVerified) {
    throw new Error('Email déjà vérifié');
  }

  // Créer et envoyer le code
  const code = await createEmailVerificationCode(email, user.id);
  
  try {
    await sendVerificationCodeEmail(email, code, user.firstName);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Erreur lors de l\'envoi du code de vérification');
  }

  return { message: 'Code de vérification envoyé par email' };
};

/**
 * Service d'envoi de code de vérification SMS
 */
export const sendPhoneVerificationCode = async (phone) => {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (user.phoneVerified) {
    throw new Error('Téléphone déjà vérifié');
  }

  // Créer et envoyer le code
  const code = await createPhoneVerificationCode(phone, user.id);
  
  try {
    await sendVerificationCodeSMS(phone, code);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    throw new Error('Erreur lors de l\'envoi du code de vérification');
  }

  return { message: 'Code de vérification envoyé par SMS' };
};

/**
 * Service de vérification d'email
 */
export const verifyEmail = async (email, code) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (user.emailVerified) {
    throw new Error('Email déjà vérifié');
  }

  // Vérifier le code
  await verifyCode(email, code, 'EMAIL');

  // Marquer l'email comme vérifié
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  return { message: 'Email vérifié avec succès' };
};

/**
 * Service de vérification de téléphone
 */
export const verifyPhone = async (phone, code) => {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (user.phoneVerified) {
    throw new Error('Téléphone déjà vérifié');
  }

  // Vérifier le code
  await verifyCode(phone, code, 'PHONE');

  // Marquer le téléphone comme vérifié
  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerified: true },
  });

  return { message: 'Téléphone vérifié avec succès' };
};

/**
 * Service de demande de réinitialisation de mot de passe
 */
export const requestPasswordReset = async (email) => {
  const result = await createPasswordResetToken(email);
  
  // Si l'email a été envoyé avec succès, retourner un message positif
  if (result.emailSent) {
    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
  }
  
  // Si l'email n'a pas pu être envoyé mais le token a été créé, retourner un message avec avertissement
  if (!result.emailSent && result.error) {
    console.warn(`⚠️  Token créé mais email non envoyé pour ${email}: ${result.error}`);
    return { 
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      warning: 'Vérifiez la configuration email du serveur'
    };
  }
  
  // Par défaut, ne pas révéler si l'email existe ou non (sécurité)
  return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
};

/**
 * Service de réinitialisation de mot de passe
 */
export const resetPassword = async (token, newPassword) => {
  return await resetPasswordWithToken(token, newPassword);
};

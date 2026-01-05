import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.utils.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.utils.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Génère un mot de passe aléatoire pour les utilisateurs OAuth
 */
const generateRandomPassword = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Trouve ou crée un utilisateur OAuth
 */
export const findOrCreateOAuthUser = async (provider, providerId, email, userData) => {
  const { firstName, lastName, fullName, photo } = userData;

  // Chercher un utilisateur existant par email
  let user = await prisma.user.findUnique({
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

  if (user) {
    // Utilisateur existant - mettre à jour la photo si fournie
    if (photo && !user.photo) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { photo },
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
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
  } else {
    // Nouvel utilisateur - créer un compte BUYER par défaut
    const randomPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(randomPassword);

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        accountType: 'BUYER',
        accountStatus: 'ACTIVE',
        firstName,
        lastName,
        fullName: fullName || (firstName && lastName ? `${firstName} ${lastName}` : null),
        photo,
        emailVerified: true, // OAuth emails sont considérés comme vérifiés
      },
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

    // Créer le profil acheteur
    await prisma.buyerProfile.create({
      data: {
        userId: user.id,
      },
    });

    // Créer le portefeuille
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        currency: 'XOF',
      },
    });
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

  // Retourner l'utilisateur sans le mot de passe
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};



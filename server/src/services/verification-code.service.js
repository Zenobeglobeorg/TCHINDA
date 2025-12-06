import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Durée de validité des codes (10 minutes)
const CODE_EXPIRY_MINUTES = 10;
const CODE_LENGTH = 6;

/**
 * Génère un code de vérification aléatoire
 */
const generateCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Crée un code de vérification pour un email
 */
export const createEmailVerificationCode = async (email, userId) => {
  // Supprimer les anciens codes pour cet email
  await prisma.verificationCode.deleteMany({
    where: {
      email,
      type: 'EMAIL',
    },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      email,
      userId,
      code,
      type: 'EMAIL',
      expiresAt,
    },
  });

  return code;
};

/**
 * Crée un code de vérification pour un téléphone
 */
export const createPhoneVerificationCode = async (phone, userId) => {
  // Supprimer les anciens codes pour ce téléphone
  await prisma.verificationCode.deleteMany({
    where: {
      phone,
      type: 'PHONE',
    },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      phone,
      userId,
      code,
      type: 'PHONE',
      expiresAt,
    },
  });

  return code;
};

/**
 * Vérifie un code de vérification
 */
export const verifyCode = async (identifier, code, type) => {
  const where = type === 'EMAIL' 
    ? { email: identifier, type, code }
    : { phone: identifier, type, code };

  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      ...where,
      expiresAt: {
        gte: new Date(), // Code non expiré
      },
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!verificationCode) {
    throw new Error('Code de vérification invalide ou expiré');
  }

  // Marquer le code comme utilisé
  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: { used: true },
  });

  return true;
};

/**
 * Nettoie les codes expirés (à appeler périodiquement)
 */
export const cleanExpiredCodes = async () => {
  const deleted = await prisma.verificationCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return deleted.count;
};



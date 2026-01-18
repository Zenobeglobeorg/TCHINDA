import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupérer tous les utilisateurs pour l'administration
 */
export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      wallet: true,
    },
  });

  return users;
};

/**
 * Récupérer un utilisateur par son ID avec tous ses détails
 */
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      buyerProfile: true,
      sellerProfile: true,
      commercialProfile: true,
      moderatorProfile: true,
      accountantProfile: true,
      deliveryProfile: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};

/**
 * Mettre à jour un utilisateur
 */
export const updateUser = async (userId, userData) => {
  const { firstName, lastName, email, phone, accountType, accountStatus } = userData;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(accountType !== undefined && { accountType }),
      ...(accountStatus !== undefined && { accountStatus }),
      ...(firstName && lastName && { fullName: `${firstName} ${lastName}` }),
    },
  });

  return user;
};

/**
 * Changer le statut d'un utilisateur
 */
export const updateUserStatus = async (userId, status) => {
  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'];
  if (!validStatuses.includes(status)) {
    throw new Error('Statut invalide');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: status },
  });

  return user;
};

/**
 * Créer un nouvel utilisateur (par admin)
 */
export const createUser = async (userData) => {
  const { hashPassword } = await import('../utils/password.utils.js');
  const {
    email,
    password,
    accountType,
    firstName,
    lastName,
    phone,
    country,
  } = userData;

  return await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    if (phone) {
      const existingPhone = await tx.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new Error('Ce numéro de téléphone est déjà utilisé');
      }
    }

    const hashedPassword = await hashPassword(password);
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        accountType,
        firstName,
        lastName,
        fullName,
        phone,
        country,
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: phone ? true : false,
      },
    });

    switch (accountType) {
      case 'BUYER':
        await tx.buyerProfile.create({ data: { userId: user.id } });
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
          },
        });
        break;
      case 'SELLER':
        await tx.sellerProfile.create({ data: { userId: user.id } });
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
          },
        });
        break;
      case 'MODERATOR':
        await tx.moderatorProfile.create({ data: { userId: user.id } });
        break;
      case 'ACCOUNTANT':
        await tx.accountantProfile.create({ data: { userId: user.id } });
        break;
      case 'DELIVERY':
        await tx.deliveryProfile.create({ data: { userId: user.id } });
        break;
      case 'COMMERCIAL':
        await tx.commercialProfile.create({ data: { userId: user.id } });
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
          },
        });
        break;
    }

    return user;
  });
};

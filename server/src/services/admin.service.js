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
  });

  return users;
};


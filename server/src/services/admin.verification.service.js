import { prisma } from '../utils/prisma.js';

export const adminVerificationService = {
  async listVerifications({ status, method, userId, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (status) where.status = status;
    if (method) where.method = method;
    if (userId) where.userId = userId;

    return await prisma.verification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            kycVerified: true,
            verificationStatus: true,
            accountType: true,
            accountStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 50,
      skip: Number(offset) || 0,
    });
  },

  async approveVerification({ verificationId, adminUserId, notes } = {}) {
    if (!verificationId) {
      const err = new Error('verificationId requis');
      err.statusCode = 400;
      throw err;
    }

    const existing = await prisma.verification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!existing) {
      const err = new Error('Vérification non trouvée');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      const verification = await tx.verification.update({
        where: { id: verificationId },
        data: {
          status: 'VERIFIED',
          verifiedBy: adminUserId || null,
          verifiedAt: now,
          rejectionReason: null,
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              kycVerified: true,
              verificationStatus: true,
            },
          },
        },
      });

      // Si c'est un KYC, mettre à jour le user
      if (verification.method && String(verification.method).startsWith('KYC')) {
        await tx.user.update({
          where: { id: verification.userId },
          data: {
            kycVerified: true,
            verificationStatus: 'VERIFIED',
          },
        });
      }

      return verification;
    });
  },

  async rejectVerification({ verificationId, adminUserId, rejectionReason, notes } = {}) {
    if (!verificationId) {
      const err = new Error('verificationId requis');
      err.statusCode = 400;
      throw err;
    }
    if (!rejectionReason) {
      const err = new Error('rejectionReason requis');
      err.statusCode = 400;
      throw err;
    }

    const existing = await prisma.verification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!existing) {
      const err = new Error('Vérification non trouvée');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      const verification = await tx.verification.update({
        where: { id: verificationId },
        data: {
          status: 'REJECTED',
          verifiedBy: adminUserId || null,
          verifiedAt: now,
          rejectionReason,
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      // Si c'est un KYC, mettre à jour le user (statut global)
      if (verification.method && String(verification.method).startsWith('KYC')) {
        await tx.user.update({
          where: { id: verification.userId },
          data: {
            kycVerified: false,
            verificationStatus: 'REJECTED',
          },
        });
      }

      return verification;
    });
  },
};


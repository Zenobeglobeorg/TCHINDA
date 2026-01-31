import { prisma } from '../utils/prisma.js';

/**
 * Jobs de nettoyage automatique des tokens et codes expirés
 * À appeler périodiquement (via node-cron ou un scheduler externe)
 */
export const startCleanupJobs = async () => {
  // Vérifier si node-cron est disponible
  let cron;
  try {
    // Utiliser import dynamique pour ES modules
    const cronModule = await import('node-cron');
    cron = cronModule.default || cronModule;
  } catch (error) {
    console.warn('⚠️  node-cron non installé. Les jobs de nettoyage automatique ne seront pas démarrés.');
    console.warn('   Pour activer les jobs de nettoyage, installez node-cron: npm install node-cron');
    return;
  }

  // Nettoyer les refresh tokens expirés/révoqués (toutes les heures)
  cron.schedule('0 * * * *', async () => {
    try {
      const deleted = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true },
          ],
        },
      });
      if (deleted.count > 0) {
        console.log(`🧹 Nettoyé ${deleted.count} refresh tokens expirés/révoqués`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des refresh tokens:', error);
    }
  });

  // Nettoyer les codes de vérification expirés (toutes les 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const deleted = await prisma.verificationCode.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      if (deleted.count > 0) {
        console.log(`🧹 Nettoyé ${deleted.count} codes de vérification expirés`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des codes:', error);
    }
  });

  // Nettoyer les tokens de réinitialisation expirés (toutes les heures)
  cron.schedule('0 * * * *', async () => {
    try {
      const deleted = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true },
          ],
        },
      });
      if (deleted.count > 0) {
        console.log(`🧹 Nettoyé ${deleted.count} tokens de réinitialisation`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des tokens:', error);
    }
  });

  console.log('✅ Jobs de nettoyage automatique démarrés');
};

/**
 * Fonction pour nettoyer manuellement (utile pour les tests ou appels ponctuels)
 */
export const runCleanup = async () => {
  const results = {
    refreshTokens: 0,
    verificationCodes: 0,
    passwordResetTokens: 0,
  };

  try {
    // Nettoyer les refresh tokens
    const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    results.refreshTokens = deletedRefreshTokens.count;

    // Nettoyer les codes de vérification
    const deletedCodes = await prisma.verificationCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    results.verificationCodes = deletedCodes.count;

    // Nettoyer les tokens de réinitialisation
    const deletedResetTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true },
        ],
      },
    });
    results.passwordResetTokens = deletedResetTokens.count;

    console.log('🧹 Nettoyage manuel terminé:', results);
    return results;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage manuel:', error);
    throw error;
  }
};

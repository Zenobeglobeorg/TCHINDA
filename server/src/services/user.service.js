import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.utils.js';

/**
 * Service pour changer le type de compte (BUYER -> SELLER)
 * Seuls les acheteurs peuvent devenir vendeurs
 * Utilise une transaction pour garantir la cohérence
 */
export const changeAccountType = async (userId, newAccountType) => {
  return await prisma.$transaction(async (tx) => {
    // Récupérer l'utilisateur actuel
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur est actuellement un BUYER
    if (user.accountType !== 'BUYER') {
      throw new Error('Seuls les acheteurs peuvent changer leur type de compte');
    }

    // Vérifier que le nouveau type est SELLER
    if (newAccountType !== 'SELLER') {
      throw new Error('Vous ne pouvez devenir que vendeur. Les autres types de compte nécessitent une validation administrative.');
    }

    // Vérifier si l'utilisateur a déjà un profil vendeur (cas où il serait déjà passé vendeur puis revenu acheteur)
    // Dans ce cas, on ne fait que changer le type de compte
    if (user.sellerProfile) {
      // Mettre à jour le type de compte
      await tx.user.update({
        where: { id: userId },
        data: {
          accountType: 'SELLER',
          accountStatus: 'ACTIVE',
        },
      });

      // Générer un nouveau token avec le nouveau type de compte
      const token = generateToken(userId, 'SELLER', user.email);

      return {
        message: 'Type de compte changé avec succès',
        accountType: 'SELLER',
        token,
      };
    }

    // Si l'utilisateur n'a pas encore de profil vendeur, créer le profil
    await tx.sellerProfile.create({
      data: { userId: user.id },
    });

    // Vérifier si l'utilisateur a déjà un portefeuille
    // Si oui, on le garde. Sinon, on en crée un nouveau
    if (!user.wallet) {
      await tx.wallet.create({
        data: {
          userId: user.id,
          currency: user.country === 'SN' || user.country === 'CI' ? 'XOF' : 'XAF',
        },
      });
    }

    // Mettre à jour le type de compte
    await tx.user.update({
      where: { id: userId },
      data: {
        accountType: 'SELLER',
        accountStatus: 'ACTIVE',
      },
    });

    // Générer un nouveau token avec le nouveau type de compte
    const token = generateToken(userId, 'SELLER', user.email);

    return {
      message: 'Type de compte changé avec succès. Vous êtes maintenant vendeur.',
      accountType: 'SELLER',
      token,
    };
  });
};

/**
 * Service pour revenir de SELLER à BUYER
 * Utilise une transaction pour garantir la cohérence
 */
export const revertToBuyer = async (userId) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        sellerProfile: true,
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur est actuellement un SELLER
    if (user.accountType !== 'SELLER') {
      throw new Error('Vous devez être vendeur pour revenir à acheteur');
    }

    // Vérifier si l'utilisateur a déjà un profil acheteur
    if (!user.buyerProfile) {
      await tx.buyerProfile.create({
        data: { userId: user.id },
      });
    }

    // Mettre à jour le type de compte
    await tx.user.update({
      where: { id: userId },
      data: {
        accountType: 'BUYER',
        accountStatus: 'ACTIVE',
      },
    });

    // Générer un nouveau token avec le nouveau type de compte
    const token = generateToken(userId, 'BUYER', user.email);

    return {
      message: 'Type de compte changé avec succès. Vous êtes maintenant acheteur.',
      accountType: 'BUYER',
      token,
    };
  });
};


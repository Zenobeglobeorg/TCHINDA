import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtenir le portefeuille d'un utilisateur
 */
const getWallet = async (userId) => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      walletCurrencies: true,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        currency: 'XOF',
      },
      include: {
        walletCurrencies: true,
      },
    });
  }

  return wallet;
};

/**
 * Effectuer un dépôt pour un utilisateur (par commercial)
 */
export const depositForUser = async (commercialId, userId, { amount, currency, paymentMethod, description }) => {
  const wallet = await getWallet(userId);

  // Find or create currency wallet
  let walletCurrency = await prisma.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId: wallet.id,
        currency,
      },
    },
  });

  if (!walletCurrency) {
    walletCurrency = await prisma.walletCurrency.create({
      data: {
        walletId: wallet.id,
        currency,
        balance: 0,
      },
    });
  }

  // Update balance
  const newBalance = parseFloat(walletCurrency.balance) + parseFloat(amount);
  await prisma.walletCurrency.update({
    where: { id: walletCurrency.id },
    data: { balance: newBalance },
  });

  // Update main wallet balance
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        increment: parseFloat(amount),
      },
    },
  });

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount: parseFloat(amount),
      currency,
      status: 'COMPLETED',
      paymentMethod,
      description: description || `Dépôt effectué par commercial`,
      metadata: {
        processedBy: commercialId,
        processedAt: new Date().toISOString(),
      },
    },
  });

  return transaction;
};

/**
 * Effectuer un retrait pour un utilisateur (par commercial)
 */
export const withdrawForUser = async (commercialId, userId, { amount, currency, paymentMethod, description }) => {
  const wallet = await getWallet(userId);

  const walletCurrency = await prisma.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId: wallet.id,
        currency,
      },
    },
  });

  if (!walletCurrency || parseFloat(walletCurrency.balance) < parseFloat(amount)) {
    throw new Error('Solde insuffisant');
  }

  // Update balance
  const newBalance = parseFloat(walletCurrency.balance) - parseFloat(amount);
  await prisma.walletCurrency.update({
    where: { id: walletCurrency.id },
    data: { balance: newBalance },
  });

  // Update main wallet balance
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        decrement: parseFloat(amount),
      },
    },
  });

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount: parseFloat(amount),
      currency,
      status: 'COMPLETED',
      paymentMethod,
      description: description || `Retrait effectué par commercial`,
      metadata: {
        processedBy: commercialId,
        processedAt: new Date().toISOString(),
      },
    },
  });

  return transaction;
};

/**
 * Obtenir les transactions d'un utilisateur
 */
export const getUserTransactions = async (userId, options = {}) => {
  const wallet = await getWallet(userId);

  return await prisma.transaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0,
  });
};

/**
 * Rechercher un utilisateur par email ou téléphone
 */
export const searchUser = async (query) => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
      accountType: {
        in: ['BUYER', 'SELLER'],
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      accountType: true,
      wallet: {
        include: {
          walletCurrencies: true,
        },
      },
    },
    take: 20,
  });

  return users;
};

/**
 * Obtenir les statistiques du commercial
 */
export const getCommercialStats = async (commercialId, period = 'today') => {
  const startDate = new Date();
  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate },
      metadata: {
        path: ['processedBy'],
        equals: commercialId,
      },
    },
  });

  const deposits = transactions.filter((t) => t.type === 'DEPOSIT');
  const withdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL');

  const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return {
    totalTransactions: transactions.length,
    totalDeposits,
    totalWithdrawals,
    depositsCount: deposits.length,
    withdrawalsCount: withdrawals.length,
  };
};

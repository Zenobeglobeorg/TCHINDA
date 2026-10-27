import { prisma } from '../utils/prisma.js';

const DEFAULT_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE ?? 5);
const AUTO_RELEASE_DAYS = Number(process.env.ESCROW_AUTO_RELEASE_DAYS ?? 7);

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const ensureWalletCurrency = async (tx, userId, currency) => {
  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { userId, balance: 0, currency: 'XOF' } });
  }
  const walletCurrency = await tx.walletCurrency.upsert({
    where: { walletId_currency: { walletId: wallet.id, currency } },
    update: {},
    create: { walletId: wallet.id, currency, balance: 0 },
  });
  return { wallet, walletCurrency };
};

/**
 * Bloque les fonds d'une commande payée : un Escrow par vendeur, crédité en "pendingBalance".
 * Idempotent (un seul Escrow par commande/vendeur). À appeler dans la transaction qui marque la commande PAID.
 * Les frais de livraison ne sont pas attribués aux vendeurs.
 */
export const holdOrderFunds = async (tx, orderId) => {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { sellerId: true } } } } },
  });
  if (!order) throw new Error('Commande introuvable');

  const bySeller = new Map();
  for (const item of order.items) {
    const sellerId = item.product?.sellerId;
    if (!sellerId) continue;
    bySeller.set(sellerId, (bySeller.get(sellerId) || 0) + Number(item.total));
  }

  const created = [];
  for (const [sellerId, gross] of bySeller) {
    const existing = await tx.escrow.findUnique({
      where: { orderId_sellerId: { orderId, sellerId } },
    });
    if (existing) continue;

    const profile = await tx.sellerProfile.findUnique({
      where: { userId: sellerId },
      select: { commissionRate: true },
    });
    const rate = profile?.commissionRate != null ? Number(profile.commissionRate) : DEFAULT_COMMISSION_RATE;
    const grossAmount = round2(gross);
    const commissionAmount = round2((grossAmount * rate) / 100);
    const netAmount = round2(grossAmount - commissionAmount);

    const { wallet, walletCurrency } = await ensureWalletCurrency(tx, sellerId, order.currency);

    const escrow = await tx.escrow.create({
      data: {
        orderId,
        sellerId,
        currency: order.currency,
        grossAmount,
        commissionRate: rate,
        commissionAmount,
        netAmount,
      },
    });

    const sale = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'SALE',
        amount: netAmount,
        currency: order.currency,
        status: 'PENDING',
        reference: `ESC-${escrow.id}`,
        description: `Vente commande ${order.orderNumber} (en séquestre)`,
        metadata: { orderId, escrowId: escrow.id, grossAmount, commissionRate: rate, commissionAmount },
      },
    });
    await tx.escrow.update({ where: { id: escrow.id }, data: { transactionId: sale.id } });

    await tx.walletCurrency.update({
      where: { id: walletCurrency.id },
      data: { pendingBalance: { increment: netAmount } },
    });
    created.push(escrow);
  }
  return created;
};

/** Démarre le compte à rebours de libération automatique quand la commande passe en DELIVERED. */
export const scheduleAutoRelease = async (orderId) => {
  const releaseAfter = new Date(Date.now() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);
  await prisma.escrow.updateMany({
    where: { orderId, status: 'HELD', releaseAfter: null },
    data: { releaseAfter },
  });
};

/** Libère les fonds bloqués : pendingBalance -> balance (disponible). Idempotent. */
export const releaseOrderFunds = async (orderId, { includeDisputed = false } = {}) => {
  const statuses = includeDisputed ? ['HELD', 'DISPUTED'] : ['HELD'];
  return prisma.$transaction(async (tx) => {
    const escrows = await tx.escrow.findMany({ where: { orderId, status: { in: statuses } } });
    const released = [];
    for (const escrow of escrows) {
      const claimed = await tx.escrow.updateMany({
        where: { id: escrow.id, status: { in: statuses } },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
      if (claimed.count !== 1) continue;

      const { walletCurrency } = await ensureWalletCurrency(tx, escrow.sellerId, escrow.currency);
      await tx.walletCurrency.update({
        where: { id: walletCurrency.id },
        data: {
          pendingBalance: { decrement: escrow.netAmount },
          balance: { increment: escrow.netAmount },
        },
      });
      if (escrow.transactionId) {
        await tx.transaction.update({
          where: { id: escrow.transactionId },
          data: { status: 'COMPLETED', description: 'Vente libérée du séquestre' },
        });
      }
      released.push(escrow.id);
    }
    return released;
  }, { timeout: 30000, maxWait: 10000 });
};

/**
 * Rembourse l'acheteur : annule les Escrow HELD (débit du pendingBalance vendeur)
 * et recrédite le wallet de l'acheteur du total payé. Idempotent via paymentStatus.
 */
export const refundOrderFunds = async (orderId) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentStatus !== 'PAID') return { refunded: false };

    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: 'PAID' },
      data: { paymentStatus: 'REFUNDED' },
    });
    if (claimed.count !== 1) return { refunded: false };

    const escrows = await tx.escrow.findMany({ where: { orderId, status: { in: ['HELD', 'DISPUTED'] } } });
    for (const escrow of escrows) {
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });
      const { walletCurrency } = await ensureWalletCurrency(tx, escrow.sellerId, escrow.currency);
      await tx.walletCurrency.update({
        where: { id: walletCurrency.id },
        data: { pendingBalance: { decrement: escrow.netAmount } },
      });
      if (escrow.transactionId) {
        await tx.transaction.update({
          where: { id: escrow.transactionId },
          data: { status: 'CANCELLED', description: 'Vente annulée (commande remboursée)' },
        });
      }
    }

    const { wallet, walletCurrency } = await ensureWalletCurrency(tx, order.userId, order.currency);
    await tx.walletCurrency.update({
      where: { id: walletCurrency.id },
      data: { balance: { increment: order.total } },
    });
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'REFUND',
        amount: order.total,
        currency: order.currency,
        status: 'COMPLETED',
        reference: `REF-${order.id}`,
        description: `Remboursement commande ${order.orderNumber}`,
        metadata: { orderId: order.id },
      },
    });
    return { refunded: true, amount: Number(order.total), currency: order.currency };
  }, { timeout: 30000, maxWait: 10000 });
};

/** Libère tous les séquestres dont le délai de confirmation acheteur est écoulé. */
export const releaseDueEscrows = async () => {
  const due = await prisma.escrow.findMany({
    where: { status: 'HELD', releaseAfter: { lte: new Date() } },
    select: { orderId: true },
    distinct: ['orderId'],
  });
  for (const { orderId } of due) {
    try {
      await releaseOrderFunds(orderId);
    } catch (err) {
      console.error(`[Escrow] Échec libération auto commande ${orderId}:`, err.message);
    }
  }
  return due.length;
};

const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/** Vrai si un litige est ouvert sur la commande (les fonds sont gelés). */
export const hasOpenDispute = async (orderId) =>
  (await prisma.dispute.count({ where: { orderId, status: 'OPEN' } })) > 0;

/**
 * L'acheteur ouvre un litige : le séquestre passe HELD -> DISPUTED
 * (plus de libération automatique ni de confirmation) jusqu'à décision d'un admin.
 */
export const openDispute = async (userId, orderId, reason) => {
  const text = String(reason || '').trim();
  if (text.length < 10) throw httpError('Merci de décrire le problème (10 caractères minimum)');

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw httpError('Commande non trouvée', 404);
    if (order.paymentStatus !== 'PAID') throw httpError("Cette commande n'est pas payée");
    if (!['SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw httpError("Un litige ne peut être ouvert qu'après expédition de la commande");
    }
    if ((await tx.dispute.count({ where: { orderId, status: 'OPEN' } })) > 0) {
      throw httpError('Un litige est déjà ouvert sur cette commande');
    }

    const frozen = await tx.escrow.updateMany({
      where: { orderId, status: 'HELD' },
      data: { status: 'DISPUTED' },
    });
    if (frozen.count === 0) throw httpError('Les fonds de cette commande ont déjà été libérés ou remboursés');

    return tx.dispute.create({ data: { orderId, openedById: userId, reason: text } });
  }, { timeout: 30000, maxWait: 10000 });
};

/** Décision admin : RELEASE (vendeur payé) ou REFUND (acheteur remboursé). */
export const resolveDispute = async (adminId, disputeId, resolution, note) => {
  if (!['RELEASE', 'REFUND'].includes(resolution)) throw httpError('resolution doit être RELEASE ou REFUND');

  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw httpError('Litige non trouvé', 404);

  const claimed = await prisma.dispute.updateMany({
    where: { id: disputeId, status: 'OPEN' },
    data: {
      status: resolution === 'RELEASE' ? 'RESOLVED_RELEASE' : 'RESOLVED_REFUND',
      resolutionNote: note || null,
      resolvedById: adminId,
      resolvedAt: new Date(),
    },
  });
  if (claimed.count !== 1) throw httpError('Ce litige est déjà résolu');

  if (resolution === 'RELEASE') {
    await releaseOrderFunds(dispute.orderId, { includeDisputed: true });
    await prisma.order.update({
      where: { id: dispute.orderId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
  } else {
    await refundOrderFunds(dispute.orderId);
    await prisma.order.update({ where: { id: dispute.orderId }, data: { status: 'REFUNDED' } });
  }
  return prisma.dispute.findUnique({ where: { id: disputeId } });
};

export const listDisputes = async ({ status } = {}) => {
  const disputes = await prisma.dispute.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          currency: true,
          status: true,
          sellerId: true,
          createdAt: true,
          shippedAt: true,
          deliveredAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items: { select: { quantity: true, total: true, productSnapshot: true } },
          escrows: {
            select: { sellerId: true, grossAmount: true, commissionAmount: true, netAmount: true, status: true, currency: true },
          },
        },
      },
    },
  });

  const sellerIds = [...new Set(disputes.flatMap((d) => d.order.escrows.map((e) => e.sellerId)))];
  const sellers = sellerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, firstName: true, lastName: true, phone: true, sellerProfile: { select: { shopName: true } } },
      })
    : [];
  const byId = new Map(sellers.map((u) => [u.id, u]));
  return disputes.map((d) => ({
    ...d,
    sellers: d.order.escrows.map((e) => byId.get(e.sellerId)).filter(Boolean),
  }));
};

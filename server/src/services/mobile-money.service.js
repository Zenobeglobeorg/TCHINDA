import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { holdOrderFunds } from './escrow.service.js';
import { getWallet, enforceWalletTxLimits } from './buyer.service.js';

const TX_OPTIONS = { timeout: 30000, maxWait: 10000 };

// Ids de toutes les commandes payées ensemble (même checkoutGroupId), ou de la seule commande.
const getGroupOrderIds = async (client, orderId) => {
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { id: true, checkoutGroupId: true },
  });
  if (!order) return [orderId];
  if (!order.checkoutGroupId) return [order.id];
  const group = await client.order.findMany({
    where: { checkoutGroupId: order.checkoutGroupId },
    select: { id: true },
  });
  return group.map((o) => o.id);
};

const markOrderGroupPaymentFailed = async (client, orderId) => {
  const orderIds = await getGroupOrderIds(client, orderId);
  await client.order.updateMany({
    where: { id: { in: orderIds }, paymentStatus: { not: 'PAID' } },
    data: { paymentStatus: 'FAILED' },
  });
};

// Crédite le portefeuille d'une recharge réussie. La référence de transaction est unique (MOMO-<referenceId>),
// donc même un double traitement ne peut pas créditer deux fois.
const creditWalletDeposit = async (tx, payment) => {
  const currency = payment.creditedCurrency;
  const amount = Number(payment.creditedAmount);
  let wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
  if (!wallet) wallet = await tx.wallet.create({ data: { userId: payment.userId, balance: 0, currency: 'XOF' } });
  const walletCurrency = await tx.walletCurrency.upsert({
    where: { walletId_currency: { walletId: wallet.id, currency } },
    update: {},
    create: { walletId: wallet.id, currency, balance: 0 },
  });
  await tx.walletCurrency.update({
    where: { id: walletCurrency.id },
    data: { balance: { increment: amount } },
  });
  await tx.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount,
      currency,
      status: 'COMPLETED',
      reference: `MOMO-${payment.referenceId}`,
      paymentMethod: payment.provider,
      description: `Recharge Mobile Money (${payment.provider})`,
      metadata: { paymentId: payment.id },
    },
  });
};

// Applique le résultat MTN d'un paiement de façon atomique : le statut du Payment, les commandes
// du groupe et le séquestre changent ensemble ou pas du tout. Un seul appelant "gagne" la transition.
const applyPaymentOutcome = (payment, newStatus, details = {}) =>
  prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: ['PENDING', 'CANCELLED', 'EXPIRED'] } },
      data: {
        status: newStatus,
        momoTransactionId: details.financialTransactionId || null,
        failureReason: details.reason || null,
        ...(details.metadata ? { metadata: details.metadata } : {}),
      },
    });
    if (claimed.count !== 1) return false;

    if (payment.purpose === 'DEPOSIT') {
      if (newStatus === 'SUCCESSFUL') await creditWalletDeposit(tx, payment);
      return true;
    }

    if (newStatus === 'SUCCESSFUL') {
      const orderIds = await getGroupOrderIds(tx, payment.orderId);
      for (const id of orderIds) {
        const order = await tx.order.findUnique({ where: { id }, select: { paymentStatus: true } });
        if (order?.paymentStatus === 'PAID') {
          console.warn(`⚠️ [MoMo] Double paiement: la commande ${id} était déjà payée (paiement ${payment.referenceId}) — remboursement manuel à prévoir`);
          await tx.payment.update({
            where: { id: payment.id },
            data: { failureReason: 'DOUBLE_PAIEMENT: commande déjà payée, à rembourser' },
          });
          continue;
        }
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: 'PAID',
            paymentMethod: payment.provider,
            paymentReference: payment.referenceId,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });
        await holdOrderFunds(tx, id);
      }
    } else if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(newStatus)) {
      await markOrderGroupPaymentFailed(tx, payment.orderId);
    }
    return true;
  }, TX_OPTIONS);

/**
 * Service de paiement MTN Mobile Money (MoMo Collection API)
 * Documentation: https://momodeveloper.mtn.com/docs/services/collection
 *
 * Flux complet :
 *   1. getAccessToken()    → POST /collection/token/
 *   2. requestToPay()      → POST /collection/v1_0/requesttopay
 *   3. getPaymentStatus()  → GET  /collection/v1_0/requesttopay/{referenceId}
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const MOMO_BASE_URL = (process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com').replace(/\/$/, '');
const MOMO_SUBSCRIPTION_KEY = (process.env.MOMO_SUBSCRIPTION_KEY || '').trim();
const MOMO_API_USER_ID = (process.env.MOMO_API_USER_ID || '').trim();
const MOMO_API_KEY = (process.env.MOMO_API_KEY || '').trim();
const MOMO_ENVIRONMENT = (process.env.MOMO_ENVIRONMENT || 'sandbox').trim();
const MOMO_CURRENCY = (process.env.MOMO_CURRENCY || 'EUR').trim(); // EUR en sandbox, XOF en prod
const MOMO_CALLBACK_URL = (process.env.MOMO_CALLBACK_URL || '').trim();
const XOF_PER_EUR = 655.957; // parité fixe XOF/XAF <-> EUR
const PENDING_TTL_MS = Number(process.env.MOMO_PENDING_TTL_MINUTES || 10) * 60 * 1000;
const RECHECK_WINDOW_MS = 24 * 60 * 60 * 1000;

// Cache du token en mémoire (évite de re-générer à chaque requête)
let cachedToken = null;
let tokenExpiresAt = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Headers communs à toutes les requêtes MTN MoMo Collection
 */
const buildCommonHeaders = (extraHeaders = {}) => ({
  'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
  'X-Target-Environment': MOMO_ENVIRONMENT,
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ...extraHeaders,
});

/**
 * Obtenir ou renouveler l'access token MTN MoMo
 * Le token dure 3600 secondes — on le met en cache avec une marge de sécurité de 60s
 * Auth: Basic base64(API_USER_ID:API_KEY)
 *
 * @returns {Promise<string>} access_token JWT
 */
export const getMomoAccessToken = async () => {
  const now = Date.now();

  // Retourner le token en cache s'il est encore valide
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    console.log('🔑 [MoMo] Utilisation du token en cache');
    return cachedToken;
  }

  console.log('🔑 [MoMo] Génération d\'un nouvel access token...');

  const credentials = Buffer.from(`${MOMO_API_USER_ID}:${MOMO_API_KEY}`).toString('base64');

  const response = await fetch(`${MOMO_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [MoMo] Erreur génération token: ${response.status} - ${errorText}`);
    throw new Error(`Impossible de générer le token MoMo: ${response.status}`);
  }

  const data = await response.json();

  // Mettre en cache avec marge de -60s pour éviter les expirés inattendus
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  console.log('✅ [MoMo] Token généré avec succès (expire dans ~', data.expires_in, 's)');
  return cachedToken;
};

// ─── Fonctions principales ────────────────────────────────────────────────────

/**
 * Calcule ce que MTN doit débiter, à partir des commandes du groupe (jamais depuis le client).
 * Sandbox : MTN n'accepte que l'EUR, on convertit depuis XOF/XAF (parité fixe). Production : devise de la commande.
 */
const computeCharge = (total, orderCurrency) => {
  if (MOMO_ENVIRONMENT === 'sandbox') {
    let eur;
    if (orderCurrency === MOMO_CURRENCY) eur = total;
    else if (['XOF', 'XAF'].includes(orderCurrency) && MOMO_CURRENCY === 'EUR') eur = total / XOF_PER_EUR;
    else throw new Error(`Devise ${orderCurrency} non supportée par le sandbox MTN`);
    return { amount: Math.round(eur * 100) / 100, currency: MOMO_CURRENCY };
  }
  return { amount: Math.round(total), currency: orderCurrency };
};

const computeChargeForOrders = (orders) =>
  computeCharge(orders.reduce((sum, o) => sum + parseFloat(o.total), 0), orders[0].currency || 'XOF');

// Envoie la demande de paiement à MTN (202 attendu). Retourne le corps envoyé.
const sendRequestToPay = async ({ referenceId, amount, currency, externalId, phone, payerMessage, payeeNote }) => {
  const accessToken = await getMomoAccessToken();
  const requestBody = {
    amount: amount.toString(),
    currency,
    externalId,
    payer: { partyIdType: 'MSISDN', partyId: phone },
    payerMessage: payerMessage.substring(0, 75),
    payeeNote: payeeNote.substring(0, 75),
  };

  console.log(`🚀 [MoMo] Envoi RequestToPay - referenceId: ${referenceId}, montant: ${amount} ${currency}, tel: ${phone}`);

  const momoResponse = await fetch(`${MOMO_BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: buildCommonHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'X-Reference-Id': referenceId,
      ...(MOMO_CALLBACK_URL ? { 'X-Callback-Url': MOMO_CALLBACK_URL } : {}),
    }),
    body: JSON.stringify(requestBody),
  });

  // MTN retourne 202 Accepted en cas de succès (pas 200 !)
  if (momoResponse.status !== 202) {
    const errorText = await momoResponse.text();
    console.error(`❌ [MoMo] RequestToPay échoué: ${momoResponse.status} - ${errorText}`);
    throw new Error(`Erreur MTN MoMo (${momoResponse.status}): ${errorText || 'Demande refusée'}`);
  }
  return requestBody;
};

/**
 * Initier un paiement MTN MoMo (Request To Pay) pour une commande — et toutes les commandes
 * du même panier. Le montant est calculé côté serveur : seuls orderId/phoneNumber comptent.
 */
export const initiateMomoPayment = async (userId, paymentData) => {
  const { orderId, phoneNumber, provider = 'MTN', message } = paymentData;

  if (!orderId) throw new Error('orderId est obligatoire');
  if (!phoneNumber) throw new Error('Numéro de téléphone obligatoire');
  if (!MOMO_SUBSCRIPTION_KEY || MOMO_SUBSCRIPTION_KEY === 'REMPLACE_PAR_TA_SUBSCRIPTION_KEY') {
    throw new Error('Configuration MTN MoMo manquante. Vérifiez les variables MOMO_* dans .env');
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Commande introuvable');
  if (order.userId !== userId) throw new Error('Cette commande ne vous appartient pas');

  const groupIds = await getGroupOrderIds(prisma, orderId);
  const orders = await prisma.order.findMany({ where: { id: { in: groupIds } } });
  if (orders.some((o) => o.paymentStatus === 'PAID')) throw new Error('Cette commande est déjà payée');
  if (orders.some((o) => ['CANCELLED', 'REFUNDED'].includes(o.status))) {
    throw new Error('Cette commande a été annulée');
  }

  // Paiement déjà en cours ? On le réutilise tant qu'il n'a pas expiré, sinon on l'expire.
  const existingPending = await prisma.payment.findFirst({
    where: { orderId: { in: groupIds }, status: 'PENDING' },
  });
  if (existingPending) {
    if (Date.now() - existingPending.createdAt.getTime() < PENDING_TTL_MS) {
      console.log(`⚠️ [MoMo] Paiement PENDING déjà existant pour orderId=${orderId}: ${existingPending.referenceId}`);
      return {
        referenceId: existingPending.referenceId,
        paymentId: existingPending.id,
        status: 'PENDING',
        amount: parseFloat(existingPending.amount),
        currency: existingPending.currency,
        message: 'Un paiement est déjà en cours pour cette commande. Vérifiez votre téléphone.',
      };
    }
    await applyPaymentOutcome(existingPending, 'EXPIRED', { reason: 'Délai de confirmation dépassé' });
  }

  const { amount: paymentAmount, currency: paymentCurrency } = computeChargeForOrders(orders);
  if (!(paymentAmount > 0)) throw new Error('Montant invalide');

  // MTN MoMo attend le format MSISDN sans le '+'
  const rawPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
  const referenceId = randomUUID();

  const requestBody = await sendRequestToPay({
    referenceId,
    amount: paymentAmount,
    currency: paymentCurrency,
    externalId: orderId,
    phone: rawPhone,
    payerMessage: message || `Paiement commande ${order.orderNumber || orderId.substring(0, 8)}`,
    payeeNote: `TCHINDA Commande ${order.orderNumber || orderId.substring(0, 8)}`,
  });

  const payment = await prisma.payment.create({
    data: {
      orderId,
      referenceId,
      amount: paymentAmount,
      currency: paymentCurrency,
      payerPhone: rawPhone,
      provider,
      status: 'PENDING',
      metadata: requestBody,
    },
  });

  console.log(`💾 [MoMo] Paiement sauvegardé en DB: id=${payment.id}, referenceId=${referenceId}`);

  return {
    referenceId,
    paymentId: payment.id,
    status: 'PENDING',
    amount: paymentAmount,
    currency: paymentCurrency,
    phone: rawPhone,
    message: `Demande de paiement envoyée sur le numéro ${phoneNumber}. Veuillez confirmer sur votre téléphone MTN.`,
    expiresIn: Math.round(PENDING_TTL_MS / 1000),
  };
};

const DEPOSIT_CURRENCIES = ['XOF', 'XAF', 'EUR'];

/**
 * Recharge du portefeuille par MTN MoMo. Le portefeuille n'est crédité qu'à la confirmation de MTN
 * (jamais sur la parole du client). Montant débité calculé côté serveur.
 */
export const initiateMomoDeposit = async (userId, { amount, currency = 'XOF', phoneNumber, provider = 'MTN' }) => {
  const creditedAmount = Number(amount);
  if (!Number.isFinite(creditedAmount) || creditedAmount <= 0) throw new Error('Montant invalide');
  if (!DEPOSIT_CURRENCIES.includes(currency)) {
    throw new Error(`Recharge impossible en ${currency} (devises acceptées: ${DEPOSIT_CURRENCIES.join(', ')})`);
  }
  const minDeposit = Number(process.env.MIN_DEPOSIT_XOF || 500);
  if (['XOF', 'XAF'].includes(currency) && creditedAmount < minDeposit) {
    throw new Error(`Montant minimum de recharge: ${minDeposit} ${currency}`);
  }
  if (!phoneNumber) throw new Error('Numéro de téléphone obligatoire');
  if (!MOMO_SUBSCRIPTION_KEY || MOMO_SUBSCRIPTION_KEY === 'REMPLACE_PAR_TA_SUBSCRIPTION_KEY') {
    throw new Error('Configuration MTN MoMo manquante. Vérifiez les variables MOMO_* dans .env');
  }

  const wallet = await getWallet(userId);
  await enforceWalletTxLimits({ userId, walletId: wallet.id, amount: creditedAmount, currency });

  const existing = await prisma.payment.findFirst({ where: { userId, purpose: 'DEPOSIT', status: 'PENDING' } });
  if (existing) {
    if (Date.now() - existing.createdAt.getTime() < PENDING_TTL_MS) {
      return {
        referenceId: existing.referenceId,
        paymentId: existing.id,
        status: 'PENDING',
        amount: parseFloat(existing.amount),
        currency: existing.currency,
        creditedAmount: parseFloat(existing.creditedAmount),
        creditedCurrency: existing.creditedCurrency,
        message: 'Une recharge est déjà en cours. Vérifiez votre téléphone.',
      };
    }
    await applyPaymentOutcome(existing, 'EXPIRED', { reason: 'Délai de confirmation dépassé' });
  }

  const { amount: chargeAmount, currency: chargeCurrency } = computeCharge(creditedAmount, currency);
  if (!(chargeAmount > 0)) throw new Error('Montant invalide');

  const rawPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
  const referenceId = randomUUID();

  const requestBody = await sendRequestToPay({
    referenceId,
    amount: chargeAmount,
    currency: chargeCurrency,
    externalId: `DEP-${referenceId.substring(0, 8)}`,
    phone: rawPhone,
    payerMessage: 'Recharge portefeuille TCHINDA',
    payeeNote: `TCHINDA Recharge ${creditedAmount} ${currency}`,
  });

  const payment = await prisma.payment.create({
    data: {
      userId,
      purpose: 'DEPOSIT',
      creditedAmount,
      creditedCurrency: currency,
      referenceId,
      amount: chargeAmount,
      currency: chargeCurrency,
      payerPhone: rawPhone,
      provider,
      status: 'PENDING',
      metadata: requestBody,
    },
  });

  return {
    referenceId,
    paymentId: payment.id,
    status: 'PENDING',
    amount: chargeAmount,
    currency: chargeCurrency,
    creditedAmount,
    creditedCurrency: currency,
    phone: rawPhone,
    message: `Demande de recharge envoyée sur le numéro ${phoneNumber}. Veuillez confirmer sur votre téléphone MTN.`,
    expiresIn: Math.round(PENDING_TTL_MS / 1000),
  };
};

/**
 * Vérifier le statut d'un paiement MoMo (polling frontend, ou rappel MTN).
 * La vérité vient toujours de l'API MTN, jamais du corps d'une requête entrante.
 * Un paiement annulé/expiré localement est revérifié pendant 24 h : si l'abonné a quand même
 * validé sur son téléphone, l'argent est pris — la commande doit alors être honorée.
 *
 * @param {string} referenceId
 * @param {string} [userId] - si fourni, vérifie que le paiement appartient à cet utilisateur
 */
export const getMomoPaymentStatus = async (referenceId, userId) => {
  const payment = await prisma.payment.findUnique({
    where: { referenceId },
    include: { order: true },
  });

  if (!payment) throw new Error('Paiement introuvable');
  if (userId && (payment.userId || payment.order?.userId) !== userId) throw new Error('Action non autorisée');

  if (['SUCCESSFUL', 'FAILED'].includes(payment.status)) {
    return formatPaymentResponse(payment);
  }
  if (
    ['CANCELLED', 'EXPIRED'].includes(payment.status) &&
    Date.now() - payment.updatedAt.getTime() > RECHECK_WINDOW_MS
  ) {
    return formatPaymentResponse(payment);
  }

  const accessToken = await getMomoAccessToken();
  console.log(`🔍 [MoMo] Vérification statut pour referenceId: ${referenceId}`);

  const momoResponse = await fetch(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    { method: 'GET', headers: buildCommonHeaders({ 'Authorization': `Bearer ${accessToken}` }) }
  );

  if (!momoResponse.ok) {
    const errorText = await momoResponse.text();
    console.error(`❌ [MoMo] Erreur vérification statut: ${momoResponse.status} - ${errorText}`);
    throw new Error(`Erreur MTN lors de la vérification: ${momoResponse.status}`);
  }

  const momoData = await momoResponse.json();
  console.log(`📋 [MoMo] Statut reçu de l'API: ${momoData.status} pour referenceId: ${referenceId}`);

  let newStatus = ['SUCCESSFUL', 'FAILED'].includes(momoData.status) ? momoData.status : 'PENDING';

  // Toujours en attente trop longtemps : on expire (la commande redevient payable).
  if (
    newStatus === 'PENDING' &&
    payment.status === 'PENDING' &&
    Date.now() - payment.createdAt.getTime() > PENDING_TTL_MS
  ) {
    newStatus = 'EXPIRED';
    momoData.reason = momoData.reason || 'Délai de confirmation dépassé';
  }

  let current = payment;
  if (newStatus !== 'PENDING' && newStatus !== payment.status) {
    const applied = await applyPaymentOutcome(payment, newStatus, {
      financialTransactionId: momoData.financialTransactionId,
      reason: momoData.reason,
      metadata: momoData,
    });
    if (applied) console.log(`🔄 [MoMo] ${referenceId}: ${payment.status} → ${newStatus}`);
    current = await prisma.payment.findUnique({ where: { referenceId }, include: { order: true } });
  }

  return formatPaymentResponse(current);
};

/**
 * Callback MTN (webhook public, non authentifié). Le corps n'est PAS cru : on s'en sert uniquement
 * pour identifier le paiement, puis on revérifie son état réel auprès de MTN.
 */
export const handleMomoCallback = async (callbackBody) => {
  const referenceId = callbackBody?.referenceId || callbackBody?.externalId;
  if (!referenceId) {
    console.warn('⚠️ [MoMo] Callback reçu sans referenceId, ignoré');
    return;
  }
  console.log(`📞 [MoMo] Callback reçu pour ${referenceId}, revérification auprès de MTN`);
  try {
    await getMomoPaymentStatus(referenceId);
  } catch (err) {
    console.warn(`⚠️ [MoMo] Callback ignoré pour ${referenceId}: ${err.message}`);
  }
};

/**
 * Annuler un paiement PENDING côté TCHINDA. MTN n'a pas d'endpoint d'annulation : si l'abonné valide
 * quand même sur son téléphone, le paiement sera rattrapé par getMomoPaymentStatus.
 */
export const cancelMomoPayment = async (referenceId, userId) => {
  const payment = await prisma.payment.findUnique({
    where: { referenceId },
    include: { order: true },
  });

  if (!payment) throw new Error('Paiement introuvable');
  if ((payment.userId || payment.order?.userId) !== userId) throw new Error('Action non autorisée');
  if (payment.status !== 'PENDING') {
    throw new Error(`Impossible d'annuler un paiement en état ${payment.status}`);
  }

  await applyPaymentOutcome(payment, 'CANCELLED', { reason: "Annulé par l'utilisateur" });
  const updated = await prisma.payment.findUnique({ where: { referenceId }, include: { order: true } });

  console.log(`🚫 [MoMo] Paiement ${referenceId} annulé par l'utilisateur`);
  return formatPaymentResponse(updated);
};

// ─── Helper formatting ────────────────────────────────────────────────────────

const formatPaymentResponse = (payment) => ({
  paymentId: payment.id,
  referenceId: payment.referenceId,
  status: payment.status,
  amount: parseFloat(payment.amount),
  currency: payment.currency,
  payerPhone: payment.payerPhone,
  provider: payment.provider,
  momoTransactionId: payment.momoTransactionId || null,
  failureReason: payment.failureReason || null,
  purpose: payment.purpose,
  creditedAmount: payment.creditedAmount != null ? parseFloat(payment.creditedAmount) : null,
  creditedCurrency: payment.creditedCurrency || null,
  orderId: payment.orderId,
  orderStatus: payment.order?.paymentStatus || null,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';

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
 * Initier un paiement MTN MoMo (Request To Pay)
 *
 * @param {string} userId - ID de l'utilisateur
 * @param {object} paymentData
 * @param {string} paymentData.orderId     - ID de la commande à payer
 * @param {number} paymentData.amount      - Montant à débiter
 * @param {string} paymentData.currency    - Devise (EUR en sandbox, XOF en prod)
 * @param {string} paymentData.phoneNumber - Numéro du payeur (format international)
 * @param {string} paymentData.provider    - 'MTN' (seul supporté pour l'instant)
 * @param {string} [paymentData.message]   - Message optionnel pour le payeur
 *
 * @returns {Promise<{referenceId: string, status: string, message: string}>}
 */
export const initiateMomoPayment = async (userId, paymentData) => {
  const { orderId, amount, currency, phoneNumber, provider = 'MTN', message } = paymentData;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!orderId) throw new Error('orderId est obligatoire');
  if (!amount || amount <= 0) throw new Error('Montant invalide');
  if (!phoneNumber) throw new Error('Numéro de téléphone obligatoire');
  if (!MOMO_SUBSCRIPTION_KEY || MOMO_SUBSCRIPTION_KEY === 'REMPLACE_PAR_TA_SUBSCRIPTION_KEY') {
    throw new Error('Configuration MTN MoMo manquante. Vérifiez les variables MOMO_* dans .env');
  }

  // ── Vérifier que la commande existe et appartient à l'utilisateur ───────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Commande introuvable');
  if (order.userId !== userId) throw new Error('Cette commande ne vous appartient pas');
  if (order.paymentStatus === 'PAID') throw new Error('Cette commande est déjà payée');

  // ── Vérifier qu'il n'y a pas déjà un paiement PENDING pour cette commande ──
  const existingPending = await prisma.payment.findFirst({
    where: { orderId, status: 'PENDING' },
  });
  if (existingPending) {
    console.log(`⚠️ [MoMo] Paiement PENDING déjà existant pour orderId=${orderId}: ${existingPending.referenceId}`);
    return {
      referenceId: existingPending.referenceId,
      paymentId: existingPending.id,
      status: 'PENDING',
      message: 'Un paiement est déjà en cours pour cette commande. Vérifiez votre téléphone.',
    };
  }

  // ── Normaliser le numéro de téléphone ──────────────────────────────────────
  // MTN MoMo attend le format MSISDN sans le '+'
  const rawPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');

  // ── Générer un UUID unique comme référence de la transaction ────────────────
  const referenceId = randomUUID();

  // ── Obtenir l'access token ─────────────────────────────────────────────────
  const accessToken = await getMomoAccessToken();

  const paymentCurrency = MOMO_ENVIRONMENT === 'sandbox' ? MOMO_CURRENCY : (currency || MOMO_CURRENCY);
  // Pour EUR/USD: 2 décimales. Pour XOF/XAF: entier.
  const isDecimalCurrency = ['EUR', 'USD', 'GBP'].includes(paymentCurrency);
  const paymentAmount = isDecimalCurrency 
    ? Math.round(parseFloat(amount) * 100) / 100 
    : Math.round(parseFloat(amount));

  const requestBody = {
    amount: paymentAmount.toString(), // MTN attend une string numérique
    currency: paymentCurrency,
    externalId: orderId, // Référence interne (commande)
    payer: {
      partyIdType: 'MSISDN',
      partyId: rawPhone,
    },
    payerMessage: (message || `Paiement commande ${order.orderNumber || orderId.substring(0, 8)}`).substring(0, 75),
    payeeNote: `TCHINDA Commande ${order.orderNumber || orderId.substring(0, 8)}`.substring(0, 75),
  };

  console.log(`🚀 [MoMo] Envoi RequestToPay - referenceId: ${referenceId}, montant: ${paymentAmount} ${paymentCurrency}, tel: ${rawPhone}`);

  // ── Appel API MTN MoMo ─────────────────────────────────────────────────────
  const headers = buildCommonHeaders({
    'Authorization': `Bearer ${accessToken}`,
    'X-Reference-Id': referenceId,
    ...(MOMO_CALLBACK_URL ? { 'X-Callback-Url': MOMO_CALLBACK_URL } : {}),
  });

  const momoResponse = await fetch(`${MOMO_BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  // MTN retourne 202 Accepted en cas de succès (pas 200 !)
  if (momoResponse.status !== 202) {
    const errorText = await momoResponse.text();
    console.error(`❌ [MoMo] RequestToPay échoué: ${momoResponse.status} - ${errorText}`);
    throw new Error(`Erreur MTN MoMo (${momoResponse.status}): ${errorText || 'Demande refusée'}`);
  }

  console.log(`✅ [MoMo] RequestToPay accepté (202) pour referenceId: ${referenceId}`);

  // ── Sauvegarder le paiement en base de données ─────────────────────────────
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
    expiresIn: 60, // En sandbox, timeout ~1 min ; en production, ~2 min
  };
};

/**
 * Vérifier le statut d'un paiement MoMo (polling côté frontend)
 *
 * Ce endpoint est appelé périodiquement par le frontend jusqu'à obtenir
 * SUCCESSFUL, FAILED ou CANCELLED.
 *
 * @param {string} referenceId - UUID utilisé lors de la création du paiement
 * @returns {Promise<object>} Statut mis à jour du paiement
 */
export const getMomoPaymentStatus = async (referenceId) => {
  // ── Chercher le paiement en DB ─────────────────────────────────────────────
  const payment = await prisma.payment.findUnique({
    where: { referenceId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error('Paiement introuvable');
  }

  // Si le paiement est déjà dans un état final en DB, ne pas rappeler l'API
  if (['SUCCESSFUL', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(payment.status)) {
    console.log(`ℹ️ [MoMo] Paiement ${referenceId} déjà en état final: ${payment.status}`);
    return formatPaymentResponse(payment);
  }

  // ── Interroger l'API MTN MoMo pour la vérité du statut ────────────────────
  const accessToken = await getMomoAccessToken();

  console.log(`🔍 [MoMo] Vérification statut pour referenceId: ${referenceId}`);

  const momoResponse = await fetch(
    `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      method: 'GET',
      headers: buildCommonHeaders({
        'Authorization': `Bearer ${accessToken}`,
      }),
    }
  );

  if (!momoResponse.ok) {
    const errorText = await momoResponse.text();
    console.error(`❌ [MoMo] Erreur vérification statut: ${momoResponse.status} - ${errorText}`);
    throw new Error(`Erreur MTN lors de la vérification: ${momoResponse.status}`);
  }

  const momoData = await momoResponse.json();
  console.log(`📋 [MoMo] Statut reçu de l'API: ${momoData.status} pour referenceId: ${referenceId}`);

  // ── Mapper le statut MTN vers notre enum ───────────────────────────────────
  // MTN retourne: PENDING | SUCCESSFUL | FAILED
  const statusMap = {
    PENDING: 'PENDING',
    SUCCESSFUL: 'SUCCESSFUL',
    FAILED: 'FAILED',
  };
  const newStatus = statusMap[momoData.status] || 'FAILED';

  // ── Mettre à jour le paiement en DB si le statut a changé ─────────────────
  let updatedPayment = payment;

  if (newStatus !== payment.status) {
    console.log(`🔄 [MoMo] Mise à jour statut: ${payment.status} → ${newStatus}`);

    updatedPayment = await prisma.payment.update({
      where: { referenceId },
      data: {
        status: newStatus,
        momoTransactionId: momoData.financialTransactionId || null,
        failureReason: momoData.reason || null,
        metadata: momoData,
      },
      include: { order: true },
    });

    // ── Si SUCCESSFUL, marquer la commande comme payée ─────────────────────
    if (newStatus === 'SUCCESSFUL') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: payment.provider,
          paymentReference: referenceId,
          paidAt: new Date(),
          status: 'CONFIRMED', // Passer la commande en CONFIRMED
        },
      });
      console.log(`✅ [MoMo] Commande ${payment.orderId} marquée PAID et CONFIRMED`);
    }

    // ── Si FAILED, mettre la commande en FAILED ────────────────────────────
    if (newStatus === 'FAILED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'FAILED' },
      });
      console.log(`❌ [MoMo] Commande ${payment.orderId} marquée FAILED`);
    }
  }

  return formatPaymentResponse(updatedPayment);
};

/**
 * Gérer le callback MoMo (webhook envoyé par MTN si MOMO_CALLBACK_URL est défini)
 * Optionnel en sandbox mais prévu pour la production.
 *
 * @param {object} callbackBody - Corps de la requête envoyée par MTN
 * @returns {Promise<void>}
 */
export const handleMomoCallback = async (callbackBody) => {
  const { referenceId, status, financialTransactionId, reason } = callbackBody;

  console.log(`📞 [MoMo] Callback reçu: referenceId=${referenceId}, status=${status}`);

  if (!referenceId) {
    console.warn('⚠️ [MoMo] Callback reçu sans referenceId, ignoré');
    return;
  }

  // Utiliser la même logique que getMomoPaymentStatus mais sans appel API supplémentaire
  const payment = await prisma.payment.findUnique({ where: { referenceId } });
  if (!payment) {
    console.warn(`⚠️ [MoMo] Callback: paiement ${referenceId} introuvable en DB`);
    return;
  }

  const statusMap = { PENDING: 'PENDING', SUCCESSFUL: 'SUCCESSFUL', FAILED: 'FAILED' };
  const newStatus = statusMap[status] || 'FAILED';

  if (newStatus !== payment.status) {
    await prisma.payment.update({
      where: { referenceId },
      data: {
        status: newStatus,
        momoTransactionId: financialTransactionId || null,
        failureReason: reason || null,
        metadata: callbackBody,
      },
    });

    if (newStatus === 'SUCCESSFUL') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: payment.provider,
          paymentReference: referenceId,
          paidAt: new Date(),
          status: 'CONFIRMED',
        },
      });
    }

    if (newStatus === 'FAILED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'FAILED' },
      });
    }
  }

  console.log(`✅ [MoMo] Callback traité: ${referenceId} → ${newStatus}`);
};

/**
 * Annuler un paiement PENDING (côté DB uniquement, MTN n'a pas d'endpoint d'annulation)
 *
 * @param {string} referenceId
 * @param {string} userId - Pour vérifier que l'utilisateur est propriétaire
 * @returns {Promise<object>}
 */
export const cancelMomoPayment = async (referenceId, userId) => {
  const payment = await prisma.payment.findUnique({
    where: { referenceId },
    include: { order: true },
  });

  if (!payment) throw new Error('Paiement introuvable');
  if (payment.order.userId !== userId) throw new Error('Action non autorisée');
  if (payment.status !== 'PENDING') {
    throw new Error(`Impossible d'annuler un paiement en état ${payment.status}`);
  }

  const updated = await prisma.payment.update({
    where: { referenceId },
    data: { status: 'CANCELLED', failureReason: 'Annulé par l\'utilisateur' },
    include: { order: true },
  });

  await prisma.order.update({
    where: { id: payment.orderId },
    data: { paymentStatus: 'FAILED' },
  });

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
  orderId: payment.orderId,
  orderStatus: payment.order?.paymentStatus || null,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';

/**
 * Service de paiement mobile money (MTN/Orange)
 * Pour l'instant, simulation du processus de paiement
 * En production, intégrer avec les APIs réelles de MTN/Orange
 */

const PENDING_PAYMENTS = new Map(); // En production, utiliser Redis ou DB

/**
 * Initier un paiement mobile money
 * @param {string} userId - ID de l'utilisateur
 * @param {object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant
 * @param {string} paymentData.currency - Devise
 * @param {string} paymentData.provider - 'MTN' ou 'ORANGE'
 * @param {string} paymentData.phoneNumber - Numéro de téléphone
 * @param {string} paymentData.type - 'DEPOSIT' (charger portefeuille) ou 'ORDER' (paiement commande)
 * @param {string} [paymentData.orderId] - ID de commande si type='ORDER'
 * @returns {Promise<object>} - Référence de paiement et instructions
 */
export const initiateMobileMoneyPayment = async (userId, paymentData) => {
  const { amount, currency, provider, phoneNumber, type, orderId } = paymentData;

  // Validation
  if (!amount || amount <= 0) {
    throw new Error('Montant invalide');
  }
  if (!['MTN', 'ORANGE'].includes(provider)) {
    throw new Error('Fournisseur invalide. Utilisez MTN ou ORANGE');
  }
  if (!phoneNumber || !/^(\+237|237)?[0-9]{9}$/.test(phoneNumber.replace(/\s/g, ''))) {
    throw new Error('Numéro de téléphone invalide');
  }
  if (!['DEPOSIT', 'ORDER'].includes(type)) {
    throw new Error('Type de paiement invalide');
  }

  // Générer une référence de paiement unique
  const paymentReference = `MM-${provider}-${randomUUID().substring(0, 8).toUpperCase()}`;
  const paymentId = randomUUID();

  // En production, ici on appellerait l'API MTN/Orange pour initier le paiement
  // Pour l'instant, on simule
  const paymentRecord = {
    id: paymentId,
    userId,
    amount: parseFloat(amount),
    currency,
    provider,
    phoneNumber: phoneNumber.replace(/\s/g, ''),
    type,
    orderId: type === 'ORDER' ? orderId : null,
    reference: paymentReference,
    status: 'PENDING',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  };

  // Stocker temporairement (en production, utiliser Redis ou DB)
  PENDING_PAYMENTS.set(paymentId, paymentRecord);

  // Simuler l'envoi de la demande de paiement
  // En production, l'API MTN/Orange enverrait un SMS avec le code de confirmation
  const instructions = {
    message: `Un SMS de confirmation a été envoyé au ${phoneNumber}. Veuillez confirmer le paiement.`,
    reference: paymentReference,
    amount: `${amount} ${currency}`,
    provider,
  };

  return {
    paymentId,
    reference: paymentReference,
    instructions,
    expiresAt: paymentRecord.expiresAt,
  };
};

/**
 * Vérifier le statut d'un paiement mobile money
 * @param {string} paymentId - ID du paiement
 * @returns {Promise<object>} - Statut du paiement
 */
export const checkPaymentStatus = async (paymentId) => {
  const payment = PENDING_PAYMENTS.get(paymentId);
  
  if (!payment) {
    throw new Error('Paiement non trouvé');
  }

  // En production, vérifier le statut réel auprès de l'API MTN/Orange
  // Pour l'instant, on simule
  return {
    paymentId: payment.id,
    status: payment.status,
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
  };
};

/**
 * Confirmer un paiement mobile money (simulation)
 * En production, cette fonction serait appelée par un webhook de MTN/Orange
 * @param {string} paymentId - ID du paiement
 * @param {string} [confirmationCode] - Code de confirmation (pour simulation)
 * @returns {Promise<object>} - Résultat de la confirmation
 */
export const confirmMobileMoneyPayment = async (paymentId, confirmationCode = null) => {
  const payment = PENDING_PAYMENTS.get(paymentId);

  if (!payment) {
    throw new Error('Paiement non trouvé');
  }

  if (payment.status !== 'PENDING') {
    throw new Error(`Paiement déjà ${payment.status}`);
  }

  if (new Date() > payment.expiresAt) {
    payment.status = 'EXPIRED';
    PENDING_PAYMENTS.set(paymentId, payment);
    throw new Error('Paiement expiré');
  }

  // En production, vérifier le code de confirmation avec l'API MTN/Orange
  // Pour l'instant, on accepte n'importe quel code ou on simule la confirmation
  if (confirmationCode && confirmationCode !== '123456') {
    // Code de test: 123456
    throw new Error('Code de confirmation invalide');
  }

  // Marquer comme confirmé
  payment.status = 'COMPLETED';
  payment.completedAt = new Date();
  PENDING_PAYMENTS.set(paymentId, payment);

  // Traiter le paiement selon le type
  if (payment.type === 'DEPOSIT') {
    // Créditer le portefeuille
    const { deposit } = await import('./buyer.service.js');
    await deposit(payment.userId, {
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.provider,
    });
  } else if (payment.type === 'ORDER' && payment.orderId) {
    // Marquer la commande comme payée
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    if (order.paymentStatus === 'PAID') {
      throw new Error('Commande déjà payée');
    }

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: payment.provider,
        paidAt: new Date(),
      },
    });
  }

  return {
    success: true,
    paymentId: payment.id,
    reference: payment.reference,
    status: 'COMPLETED',
    message: 'Paiement confirmé avec succès',
  };
};

/**
 * Annuler un paiement mobile money
 * @param {string} paymentId - ID du paiement
 * @returns {Promise<object>} - Résultat de l'annulation
 */
export const cancelMobileMoneyPayment = async (paymentId) => {
  const payment = PENDING_PAYMENTS.get(paymentId);

  if (!payment) {
    throw new Error('Paiement non trouvé');
  }

  if (payment.status !== 'PENDING') {
    throw new Error(`Impossible d'annuler un paiement ${payment.status}`);
  }

  payment.status = 'CANCELLED';
  payment.cancelledAt = new Date();
  PENDING_PAYMENTS.set(paymentId, payment);

  return {
    success: true,
    paymentId: payment.id,
    reference: payment.reference,
    status: 'CANCELLED',
    message: 'Paiement annulé',
  };
};

/**
 * Nettoyer les paiements expirés (à appeler périodiquement)
 */
export const cleanupExpiredPayments = async () => {
  const now = new Date();
  let cleaned = 0;

  for (const [paymentId, payment] of PENDING_PAYMENTS.entries()) {
    if (payment.status === 'PENDING' && new Date(payment.expiresAt) < now) {
      payment.status = 'EXPIRED';
      PENDING_PAYMENTS.set(paymentId, payment);
      cleaned++;
    }
  }

  return cleaned;
};

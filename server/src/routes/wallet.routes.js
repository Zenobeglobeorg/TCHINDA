import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  initiateMomoDeposit,
  getMomoPaymentStatus,
  cancelMomoPayment,
} from '../services/mobile-money.service.js';

const router = express.Router();

// Recharge de portefeuille : ouverte à tous les types de compte (acheteur, vendeur...)
router.use(authenticate);

/**
 * @route   POST /api/wallet/deposit/mobile-money
 * @body    { amount, currency, phoneNumber, provider }
 */
router.post('/deposit/mobile-money', async (req, res, next) => {
  try {
    const { amount, currency, phoneNumber, provider } = req.body || {};
    const result = await initiateMomoDeposit(req.user.id, { amount, currency, phoneNumber, provider });
    res.status(202).json({ success: true, data: result, message: result.message });
  } catch (error) {
    next(error);
  }
});

/** @route GET /api/wallet/deposit/:referenceId/status */
router.get('/deposit/:referenceId/status', async (req, res, next) => {
  try {
    const status = await getMomoPaymentStatus(req.params.referenceId, req.user.id);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

/** @route POST /api/wallet/deposit/:referenceId/cancel */
router.post('/deposit/:referenceId/cancel', async (req, res, next) => {
  try {
    const result = await cancelMomoPayment(req.params.referenceId, req.user.id);
    res.json({ success: true, data: result, message: 'Recharge annulée' });
  } catch (error) {
    next(error);
  }
});

export default router;

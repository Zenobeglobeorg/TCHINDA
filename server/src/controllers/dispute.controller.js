import { openDispute, resolveDispute, listDisputes } from '../services/escrow.service.js';

export const openOrderDispute = async (req, res, next) => {
  try {
    const dispute = await openDispute(req.user.id, req.params.id, req.body?.reason);
    res.status(201).json({ success: true, data: dispute, message: 'Litige ouvert, les fonds sont gelés' });
  } catch (error) {
    next(error);
  }
};

export const adminListDisputes = async (req, res, next) => {
  try {
    const disputes = await listDisputes({ status: req.query.status });
    res.json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

export const adminResolveDispute = async (req, res, next) => {
  try {
    const { resolution, note } = req.body || {};
    const dispute = await resolveDispute(req.user.id, req.params.id, resolution, note);
    res.json({ success: true, data: dispute, message: 'Litige résolu' });
  } catch (error) {
    next(error);
  }
};

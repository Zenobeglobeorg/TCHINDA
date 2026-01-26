import { adminVerificationService } from '../services/admin.verification.service.js';

export const listVerifications = async (req, res, next) => {
  try {
    const { status, method, userId, limit = 50, offset = 0 } = req.query || {};
    const verifications = await adminVerificationService.listVerifications({
      status,
      method,
      userId,
      limit,
      offset,
    });

    res.status(200).json({ success: true, data: verifications });
  } catch (error) {
    next(error);
  }
};

export const approveVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    const verification = await adminVerificationService.approveVerification({
      verificationId: id,
      adminUserId: req.user?.id,
      notes,
    });

    res.status(200).json({
      success: true,
      message: 'Vérification approuvée',
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason, notes } = req.body || {};

    const verification = await adminVerificationService.rejectVerification({
      verificationId: id,
      adminUserId: req.user?.id,
      rejectionReason,
      notes,
    });

    res.status(200).json({
      success: true,
      message: 'Vérification rejetée',
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};


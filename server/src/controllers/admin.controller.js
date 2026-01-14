import { getAllUsers as getAllUsersService } from '../services/admin.service.js';

/**
 * @route   GET /api/admin/users
 * @desc    Lister tous les utilisateurs (administration)
 * @access  Private (ADMIN uniquement)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();

    // Adapter les données au format attendu par le front admin
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      accountType: user.accountType,
      accountStatus: user.accountStatus,
      isEmailVerified: user.emailVerified,
      isPhoneVerified: user.phoneVerified,
      kycVerified: user.kycVerified,
      createdAt: user.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};


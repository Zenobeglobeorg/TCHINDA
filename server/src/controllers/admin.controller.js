import {
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  updateUserStatus as updateUserStatusService,
  createUser as createUserService,
} from '../services/admin.service.js';

/**
 * @route   POST /api/admin/users
 * @desc    Créer un nouvel utilisateur
 * @access  Private (ADMIN uniquement)
 */
export const createUser = async (req, res, next) => {
  try {
    const { email, password, accountType, firstName, lastName, phone, country } = req.body;

    if (!email || !password || !accountType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email, mot de passe et type de compte sont requis' },
      });
    }

    const validAccountTypes = ['BUYER', 'SELLER', 'MODERATOR', 'ACCOUNTANT', 'DELIVERY', 'COMMERCIAL'];
    if (!validAccountTypes.includes(accountType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Type de compte invalide' },
      });
    }

    const user = await createUserService({
      email,
      password,
      accountType,
      firstName,
      lastName,
      phone,
      country,
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        accountType: user.accountType,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Obtenir les détails d'un utilisateur
 * @access  Private (ADMIN uniquement)
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await getUserByIdService(id);

    // Formater les données pour le frontend
    const formattedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      phone: user.phone || '',
      accountType: user.accountType,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      isEmailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isPhoneVerified: user.phoneVerified,
      kycVerified: user.kycVerified,
      country: user.country || '',
      createdAt: user.createdAt,
      wallet: user.wallet
        ? {
            balance: user.wallet.balance.toString(),
            currency: user.wallet.currency,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({
        success: false,
        error: { message: error.message },
      });
    }
    next(error);
  }
};

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

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (ADMIN uniquement)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, accountType, accountStatus } = req.body;

    const user = await updateUserService(id, {
      firstName,
      lastName,
      email,
      phone,
      accountType,
      accountStatus,
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        accountType: user.accountType,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({
        success: false,
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Changer le statut d'un utilisateur
 * @access  Private (ADMIN uniquement)
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le statut est requis' },
      });
    }

    const user = await updateUserStatusService(id, status);

    res.status(200).json({
      success: true,
      message: `Statut utilisateur mis à jour: ${status}`,
      data: {
        id: user.id,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({
        success: false,
        error: { message: error.message },
      });
    }
    if (error.message === 'Statut invalide') {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
    next(error);
  }
};

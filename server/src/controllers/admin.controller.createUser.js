// Code à ajouter dans server/src/controllers/admin.controller.js

// 1. Ajouter dans les imports (ligne 1-6):
//   createUser as createUserService,

// 2. Ajouter cette fonction avant getAllUsers:

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

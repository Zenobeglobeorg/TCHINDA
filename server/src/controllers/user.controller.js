import { changeAccountType, revertToBuyer } from '../services/user.service.js';

/**
 * Contrôleur pour changer le type de compte
 */
export const changeAccountTypeController = async (req, res, next) => {
  try {
    const { newAccountType } = req.body;
    const userId = req.user.id;

    if (!newAccountType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le nouveau type de compte est requis' },
      });
    }

    const result = await changeAccountType(userId, newAccountType);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        accountType: result.accountType,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour revenir à BUYER
 */
export const revertToBuyerController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await revertToBuyer(userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        accountType: result.accountType,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};


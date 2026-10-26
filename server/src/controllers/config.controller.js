import { getRates } from '../services/currency.service.js';

export const getCurrencyRates = async (req, res) => {
  try {
    const { rates, stale, pegsOnly } = await getRates();
    res.status(200).json({
      success: true,
      data: rates,
      ...(stale && {
        warning: pegsOnly
          ? 'Taux externes indisponibles : seules les devises à parité fixe (XOF, XAF, EUR) sont fiables'
          : "Taux issus du cache en raison d'une panne réseau",
      }),
    });
  } catch (error) {
    console.error('Erreur API Taux de devises:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur serveur lors de la récupération des taux de change', details: error.message },
    });
  }
};

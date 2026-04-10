// Implémentation du cache simple en mémoire pour éviter le sur-usage de l'API limit
let ratesCache = {
  data: null,
  lastFetch: 0
};
const CACHE_DURATION = 3600 * 1000; // 1 heure

export const getCurrencyRates = async (req, res) => {
  try {
    const now = Date.now();
    
    // Si le cache est valide, on le renvoie
    if (ratesCache.data && (now - ratesCache.lastFetch < CACHE_DURATION)) {
      return res.status(200).json({
        success: true,
        data: ratesCache.data
      });
    }

    // Sinon, on appelle l'API externe (ExchangeRate-API)
    // Nous définissons la clé en dur temporairement (idéalement à mettre dans .env)
    const API_KEY = process.env.EXCHANGERATE_API_KEY || 'ea7dd46dfee7f4d90cfe9fd3';
    const BASE_CURRENCY = 'XAF';

    // Node 18+ dispose de fetch natif
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`);
    const apiData = await response.json();

    if (apiData && apiData.result === 'success' && apiData.conversion_rates) {
      // Ajustement : on s'assure que XOF = XAF
      const processedRates = {
        ...apiData.conversion_rates,
        XOF: apiData.conversion_rates['XAF'] || 1
      };

      // Mettre en cache
      ratesCache = {
        data: processedRates,
        lastFetch: now
      };

      return res.status(200).json({
        success: true,
        data: processedRates
      });
    } else {
      throw new Error("Impossible de récupérer les taux de conversion");
    }

  } catch (error) {
    console.error('Erreur API Taux de devises:', error);
    // En cas d'erreur de réseau, utiliser le cache expiré comme fallback si disponible
    if (ratesCache.data) {
        return res.status(200).json({
          success: true,
          data: ratesCache.data,
          warning: "Taux issus du cache en raison d'une panne réseau"
        });
    }

    return res.status(500).json({
      success: false,
      error: { message: "Erreur serveur lors de la récupération des taux de change", details: error.message }
    });
  }
};

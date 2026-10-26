// Taux de change : base XAF (1 XAF = rates[devise]). XOF = XAF (même parité), EUR = parité fixe (655,957 XAF/XOF).
// Les autres devises viennent d'ExchangeRate-API (cache 1 h, tolérance de 24 h si l'API est en panne).
export const CFA_PER_EUR = 655.957;
const CACHE_DURATION = 3600 * 1000;
const MAX_STALE = 24 * 3600 * 1000;

let ratesCache = { data: null, lastFetch: 0 };

const withPegs = (apiRates) => ({
  ...apiRates,
  XAF: 1,
  XOF: 1,
  EUR: 1 / CFA_PER_EUR,
});

const fetchFromApi = async () => {
  const apiKey = process.env.EXCHANGERATE_API_KEY || 'ea7dd46dfee7f4d90cfe9fd3';
  const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/XAF`);
  const apiData = await response.json();
  if (apiData?.result !== 'success' || !apiData.conversion_rates) {
    throw new Error('Impossible de récupérer les taux de conversion');
  }
  return withPegs(apiData.conversion_rates);
};

/** Retourne { rates, stale } ou lève une erreur si aucun taux fiable n'est disponible. */
export const getRates = async () => {
  const now = Date.now();
  if (ratesCache.data && now - ratesCache.lastFetch < CACHE_DURATION) {
    return { rates: ratesCache.data, stale: false };
  }
  try {
    ratesCache = { data: await fetchFromApi(), lastFetch: now };
    return { rates: ratesCache.data, stale: false };
  } catch (error) {
    console.error('Erreur API Taux de devises:', error.message);
    if (ratesCache.data && now - ratesCache.lastFetch < MAX_STALE) {
      return { rates: ratesCache.data, stale: true };
    }
    // Sans API, seules les devises à parité fixe restent convertibles
    return { rates: withPegs({}), stale: true, pegsOnly: true };
  }
};

/** Convertit un montant entre deux devises. Lève une erreur si un taux manque. */
export const convertAmount = async (amount, from, to) => {
  if (from === to) return { converted: amount, rate: 1 };
  const { rates } = await getRates();
  if (!rates[from] || !rates[to]) {
    const err = new Error(`Taux de change indisponible pour ${from} → ${to}. Réessayez plus tard.`);
    err.statusCode = 503;
    throw err;
  }
  const rate = rates[to] / rates[from];
  return { converted: Math.round(amount * rate * 100) / 100, rate };
};

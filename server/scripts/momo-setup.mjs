// Génère un API User + une API Key pour le sandbox MTN MoMo (Collection) et teste la connexion.
// Usage : node scripts/momo-setup.mjs <SUBSCRIPTION_KEY_COLLECTION>
import { randomUUID } from 'crypto';

const BASE = 'https://sandbox.momodeveloper.mtn.com';
const subscriptionKey = (process.argv[2] || '').trim();

if (!subscriptionKey) {
  console.error('Usage : node scripts/momo-setup.mjs <SUBSCRIPTION_KEY_COLLECTION>');
  process.exit(1);
}

const fail = async (step, res) => {
  console.error(`\n❌ ${step} a échoué (HTTP ${res.status}) : ${(await res.text()) || '(pas de détail)'}`);
  if (res.status === 401) console.error('   -> Clé d\'abonnement refusée : vérifie que tu as copié la clé du produit "Collection" et qu\'elle est active.');
  if (res.status === 409) console.error('   -> Cet identifiant existe déjà, relance le script.');
  process.exit(1);
};

// 1) Créer l'API User (l'UUID généré EST l'API User ID)
const apiUserId = randomUUID();
let res = await fetch(`${BASE}/v1_0/apiuser`, {
  method: 'POST',
  headers: {
    'X-Reference-Id': apiUserId,
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ providerCallbackHost: 'localhost' }),
});
if (res.status !== 201) await fail('Création de l\'API User', res);
console.log('✅ API User créé');

// 2) Générer l'API Key de cet utilisateur
res = await fetch(`${BASE}/v1_0/apiuser/${apiUserId}/apikey`, {
  method: 'POST',
  headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey },
});
if (res.status !== 201) await fail('Génération de l\'API Key', res);
const { apiKey } = await res.json();
console.log('✅ API Key générée');

// 3) Vérifier en demandant un access token (exactement ce que fait le serveur TCHINDA)
const basic = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');
res = await fetch(`${BASE}/collection/token/`, {
  method: 'POST',
  headers: { Authorization: `Basic ${basic}`, 'Ocp-Apim-Subscription-Key': subscriptionKey },
});
if (!res.ok) await fail('Test du token', res);
console.log('✅ Token obtenu : les 3 valeurs fonctionnent ensemble\n');

console.log('Copie ces lignes dans server/.env (remplace les anciennes valeurs MOMO_*) :\n');
console.log(`MOMO_BASE_URL="${BASE}"`);
console.log(`MOMO_SUBSCRIPTION_KEY="${subscriptionKey}"`);
console.log(`MOMO_API_USER_ID="${apiUserId}"`);
console.log(`MOMO_API_KEY="${apiKey}"`);
console.log('MOMO_ENVIRONMENT="sandbox"');
console.log('MOMO_CURRENCY="EUR"');
console.log('\n⚠️  L\'API Key ne sera plus réaffichée : garde-la dans .env uniquement (jamais dans git ni dans un chat).');

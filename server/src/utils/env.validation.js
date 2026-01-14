/**
 * Validation des variables d'environnement critiques
 */
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
];

const optionalEnvVars = {
  'EMAIL_USER': 'Email non configuré (mode test)',
  'EMAIL_PASS': 'Email non configuré (mode test)',
  'SMS_PROVIDER': 'SMS en mode test',
};

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    throw new Error('Variables d\'environnement critiques manquantes');
  }
  
  // Avertissements pour les variables optionnelles
  Object.entries(optionalEnvVars).forEach(([varName, message]) => {
    if (!process.env[varName]) {
      console.warn(`⚠️  ${varName}: ${message}`);
    }
  });
  
  // Vérifier la longueur des secrets JWT
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET est trop court. Recommandé: au moins 32 caractères');
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.warn('⚠️  JWT_REFRESH_SECRET est trop court. Recommandé: au moins 32 caractères');
  }
  
  console.log('✅ Validation des variables d\'environnement réussie');
};

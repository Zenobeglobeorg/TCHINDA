// Configuration de l'API
// Pour développement local, utilisez l'IP de votre machine au lieu de localhost
// Exemple: 'http://192.168.1.100:5000' (remplacez par votre IP locale)

// Pour Android Emulator, utilisez: 'http://10.0.2.2:5000'
// Pour iOS Simulator, utilisez: 'http://localhost:5000'
// Pour appareil physique, utilisez l'IP de votre machine: 'http://192.168.x.x:5000'
// Pour Web (navigateur), utilisez: 'http://localhost:5000'

// Détection de la plateforme
import { Platform } from 'react-native';

// Note: Pour utiliser votre IP locale sur appareil physique, modifiez les valeurs ci-dessous
// Remplacez '192.168.1.100' par votre IP locale réelle
const LOCAL_IP = '192.168.1.100'; // Changez cette valeur avec votre IP locale

// Fonction pour obtenir l'URL de base selon l'environnement
const getBaseURL = () => {
  // ✅ SOLUTION RECOMMANDÉE : Utiliser Railway même en développement
  // Puisque votre backend est déjà déployé sur Railway, utilisez-le partout
  return 'https://tchinda-production.up.railway.app';
  
  // 🔧 ALTERNATIVE : Utiliser le backend local (nécessite npm run dev dans server/)
  // Décommentez le code ci-dessous si vous voulez utiliser le backend local :
  /*
  if (!__DEV__) {
    return 'https://tchinda-production.up.railway.app'; // Production Railway
  }

  // En développement local
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000'; // Android Emulator
    // Pour appareil physique : return `http://${LOCAL_IP}:5000`;
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
    // Pour appareil physique : return `http://${LOCAL_IP}:5000`;
  }

  return 'http://localhost:5000';
  */
};

export const API_CONFIG = {
  // URL de base automatiquement détectée selon la plateforme
  BASE_URL: getBaseURL(),
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH_TOKEN: '/api/auth/refresh-token',
      ME: '/api/auth/me',
      VERIFY_EMAIL: '/api/auth/verify/email',
      VERIFY_PHONE: '/api/auth/verify/phone',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
    },
  },
  
  // Timeouts
  TIMEOUT: 10000, // 10 secondes
};

// Types de comptes disponibles pour l'inscription
export const ACCOUNT_TYPES = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  COMMERCIAL: 'COMMERCIAL',
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];



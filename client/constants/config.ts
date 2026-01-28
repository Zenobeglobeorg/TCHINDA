// Configuration de l'API
// Pour développement local, utilisez l'IP de votre machine au lieu de localhost
// Exemple: 'http://192.168.1.100:5000' (remplacez par votre IP locale)

// Pour Android Emulator, utilisez: 'http://10.0.2.2:5000'
// Pour iOS Simulator, utilisez: 'http://localhost:5000'
// Pour appareil physique, utilisez l'IP de votre machine: 'http://192.168.x.x:5000'
// Pour Web (navigateur), utilisez: 'http://localhost:5000'

// Détection de la plateforme
import { Platform } from 'react-native';

// Fonction pour obtenir l'URL de base selon l'environnement
const getBaseURL = () => {
  // URL de production (Railway) - utilisée en production sur Vercel
  const PRODUCTION_API_URL = 'https://tchinda-production.up.railway.app';
  
  // Vérifier si on est en production (sur Vercel ou autre hébergeur)
  const isProduction = process.env.NODE_ENV === 'production' || 
                       typeof window !== 'undefined' && window.location.hostname !== 'localhost' && 
                       !window.location.hostname.includes('192.168') &&
                       !window.location.hostname.includes('127.0.0.1');
  
  // En production, toujours utiliser Railway
  if (isProduction) {
    return PRODUCTION_API_URL;
  }
  
  // En développement local
  if (Platform.OS === 'web') {
    // Pour web en dev, utiliser localhost ou Railway selon préférence
    // Changez cette ligne si vous voulez utiliser votre backend local
    return PRODUCTION_API_URL; // Ou 'http://localhost:5000' pour backend local
  } else if (Platform.OS === 'android') {
    // Android Emulator
    return 'http://10.0.2.2:5000';
    // Pour appareil physique : return `http://${LOCAL_IP}:5000`;
  } else if (Platform.OS === 'ios') {
    // iOS Simulator
    return 'http://localhost:5000';
    // Pour appareil physique : return `http://${LOCAL_IP}:5000`;
  }

  // Par défaut
  return PRODUCTION_API_URL;
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
      GOOGLE: '/api/auth/google',
      FACEBOOK: '/api/auth/facebook',
      APPLE: '/api/auth/apple',
    },
    CHAT: {
      CONVERSATIONS: '/api/chat/conversations',
      CONVERSATION: '/api/chat/conversation',
      MESSAGES: '/api/chat/conversation/:id/messages',
      MESSAGE: '/api/chat/message',
      REPORT: '/api/chat/message/:id/report',
      UPLOAD: '/api/chat/upload',
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



// Configuration de l'API
// Sur appareil physique (Expo Go) : l'app doit joindre un serveur accessible (Railway ou l'IP de votre PC).
// Définir EXPO_PUBLIC_API_URL dans .env pour forcer l'URL (ex: http://192.168.1.x:5000 pour backend local sur téléphone).

import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://tchinda-production.up.railway.app';

function getBaseURL(): string {
  // Override explicite (emulator: 10.0.2.2:5000, device + backend local: 192.168.x.x:5000)
  const envUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.includes('192.168') &&
      !window.location.hostname.includes('127.0.0.1'));

  if (isProduction) return PRODUCTION_API_URL;

  // Développement local
  if (Platform.OS === 'web') {
    return PRODUCTION_API_URL; // ou 'http://localhost:5000' si backend local
  }
  // Native (Android/iOS) : utiliser Railway par défaut pour que l'app sur téléphone (Expo Go) puisse se connecter.
  // 10.0.2.2 / localhost ne fonctionnent que sur émulateur/simulateur.
  return PRODUCTION_API_URL;
}

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



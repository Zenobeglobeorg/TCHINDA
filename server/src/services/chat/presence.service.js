/**
 * Service de gestion de la présence en ligne/hors ligne
 * 
 * Utilise Redis si disponible, sinon un Map en mémoire (fallback)
 * 
 * TODO: Configurer Redis pour la production
 * Pour l'instant, utilise un Map en mémoire (perd les données au redémarrage)
 */

// Map en mémoire pour stocker les utilisateurs en ligne
// Clé: userId, Valeur: { socketId, lastSeen, status }
const onlineUsers = new Map();

// Configuration Redis (si disponible)
let redisClient = null;

/**
 * Initialise le service de présence
 * Tente de se connecter à Redis si disponible
 */
export const initializePresenceService = async () => {
  try {
    // TODO: Configurer Redis
    // const redis = await import('redis');
    // redisClient = redis.createClient({ url: process.env.REDIS_URL });
    // await redisClient.connect();
    // console.log('✅ Redis connecté pour la présence');
    
    console.log('⚠️  Redis non configuré, utilisation du stockage en mémoire');
  } catch (error) {
    console.warn('⚠️  Redis non disponible, utilisation du stockage en mémoire:', error.message);
  }
};

/**
 * Marque un utilisateur comme en ligne
 * @param {string} userId - ID de l'utilisateur
 * @param {string} socketId - ID de la socket
 */
export const setUserOnline = async (userId, socketId) => {
  if (redisClient) {
    // TODO: Utiliser Redis
    // await redisClient.set(`presence:${userId}`, JSON.stringify({ socketId, lastSeen: new Date(), status: 'online' }));
    // await redisClient.expire(`presence:${userId}`, 300); // Expire après 5 minutes d'inactivité
  } else {
    onlineUsers.set(userId, {
      socketId,
      lastSeen: new Date(),
      status: 'online',
    });
  }
};

/**
 * Marque un utilisateur comme hors ligne
 * @param {string} userId - ID de l'utilisateur
 */
export const setUserOffline = async (userId) => {
  if (redisClient) {
    // TODO: Utiliser Redis
    // await redisClient.del(`presence:${userId}`);
  } else {
    onlineUsers.delete(userId);
  }
};

/**
 * Vérifie si un utilisateur est en ligne
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} - true si en ligne
 */
export const isUserOnline = async (userId) => {
  if (redisClient) {
    // TODO: Utiliser Redis
    // const data = await redisClient.get(`presence:${userId}`);
    // return data !== null;
    return false;
  } else {
    return onlineUsers.has(userId);
  }
};

/**
 * Obtient le statut de présence d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} - { socketId, lastSeen, status } ou null
 */
export const getUserPresence = async (userId) => {
  if (redisClient) {
    // TODO: Utiliser Redis
    // const data = await redisClient.get(`presence:${userId}`);
    // return data ? JSON.parse(data) : null;
    return null;
  } else {
    return onlineUsers.get(userId) || null;
  }
};

/**
 * Obtient les IDs de tous les utilisateurs en ligne
 * @returns {Promise<string[]>} - Tableau d'IDs d'utilisateurs
 */
export const getOnlineUsers = async () => {
  if (redisClient) {
    // TODO: Utiliser Redis
    // const keys = await redisClient.keys('presence:*');
    // return keys.map(key => key.replace('presence:', ''));
    return [];
  } else {
    return Array.from(onlineUsers.keys());
  }
};

/**
 * Nettoie les utilisateurs inactifs (appelé périodiquement)
 */
export const cleanupInactiveUsers = async () => {
  const now = new Date();
  const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  if (!redisClient) {
    for (const [userId, data] of onlineUsers.entries()) {
      const timeSinceLastSeen = now - data.lastSeen;
      if (timeSinceLastSeen > INACTIVE_TIMEOUT) {
        onlineUsers.delete(userId);
      }
    }
  }
  // Redis gère automatiquement l'expiration avec TTL
};

// Nettoyer périodiquement (toutes les 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInactiveUsers, 5 * 60 * 1000);
}

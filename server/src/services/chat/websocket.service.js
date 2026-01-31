/**
 * Service WebSocket pour le chat temps réel
 * Utilise Socket.IO pour la communication bidirectionnelle
 */

import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma.js';
import { setUserOnline, setUserOffline, getUserPresence } from './presence.service.js';
import { sendMessage, markMessagesAsRead } from './chat.service.js';

let io = null;
const userSockets = new Map(); // userId -> Set<socketId>

/**
 * Initialise le serveur WebSocket
 * @param {Object} httpServer - Serveur HTTP Express
 * @returns {SocketIOServer} - Instance Socket.IO
 */
export const initializeWebSocket = (httpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware d'authentification Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Token d\'authentification manquant'));
      }

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          accountType: true,
          accountStatus: true,
        },
      });

      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      if (user.accountStatus !== 'ACTIVE') {
        return next(new Error(`Compte ${user.accountStatus.toLowerCase()}`));
      }

      // Attacher l'utilisateur à la socket
      socket.userId = user.id;
      socket.accountType = user.accountType;

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new Error('Token invalide'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expiré'));
      }
      next(error);
    }
  });

  // Gestion des connexions
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const accountType = socket.accountType;

    console.log(`[WebSocket] Utilisateur connecté: ${userId} (${accountType})`);

    // Ajouter la socket à la liste des sockets de l'utilisateur
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Marquer l'utilisateur comme en ligne
    setUserOnline(userId, socket.id);

    // Notifier les autres utilisateurs que cet utilisateur est en ligne
    socket.broadcast.emit('user:online', { userId });

    // Rejoindre les rooms des conversations de l'utilisateur
    joinUserConversations(socket, userId);

    // Événement: Rejoindre une conversation
    socket.on('conversation:join', async (data) => {
      try {
        // Le frontend peut envoyer soit une string directement, soit un objet
        const conversationId = typeof data === 'string' ? data : data?.conversationId;

        if (!conversationId) {
          socket.emit('error', { message: 'conversationId est requis' });
          return;
        }

        // Vérifier l'accès à la conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation non trouvée' });
          return;
        }

        if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
          // Vérifier si c'est un admin/moderator
          if (!['ADMIN', 'MODERATOR'].includes(accountType)) {
            socket.emit('error', { message: 'Accès non autorisé' });
            return;
          }
        }

        // Rejoindre la room de la conversation
        socket.join(`conversation:${conversationId}`);
        console.log(`[WebSocket] ${userId} a rejoint la conversation ${conversationId}`);

        // Marquer les messages comme lus
        await markMessagesAsRead(conversationId, userId);

        socket.emit('conversation:joined', { conversationId });
      } catch (error) {
        console.error('[WebSocket] Erreur lors de la jointure:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Événement: Quitter une conversation
    socket.on('conversation:leave', (data) => {
      // Le frontend peut envoyer soit une string directement, soit un objet
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        socket.emit('conversation:left', { conversationId });
      }
    });

    // Événement: Envoyer un message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, language, replyToId } = data;

        if (!conversationId) {
          socket.emit('error', { message: 'conversationId est requis' });
          return;
        }

        // Créer le message
        const message = await sendMessage({
          conversationId,
          senderId: userId,
          content,
          language,
          replyToId,
        });

        // Émettre le message à tous les participants de la conversation (y compris l'expéditeur)
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Notifier les participants (pour les notifications push)
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          console.error('[WebSocket] Conversation non trouvée:', conversationId);
          return;
        }

        const recipientId = conversation.participant1Id === userId
          ? conversation.participant2Id
          : conversation.participant1Id;

        // Vérifier si le destinataire est en ligne
        const isRecipientOnline = await getUserPresence(recipientId);
        if (!isRecipientOnline) {
          // TODO: Envoyer une notification push
          // await sendPushNotification(recipientId, { type: 'NEW_MESSAGE', conversationId });
        }
      } catch (error) {
        console.error('[WebSocket] Erreur lors de l\'envoi du message:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Événement: Marquer les messages comme lus
    socket.on('messages:read', async (data) => {
      try {
        const { conversationId } = data;
        await markMessagesAsRead(conversationId, userId);

        // Notifier les autres participants
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          readBy: userId,
        });
      } catch (error) {
        console.error('[WebSocket] Erreur lors de la lecture:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Événement: Typing indicator
    socket.on('typing:start', (data) => {
      // Le frontend peut envoyer soit une string directement, soit un objet
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          conversationId,
          userId,
        });
      }
    });

    socket.on('typing:stop', (data) => {
      // Le frontend peut envoyer soit une string directement, soit un objet
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId,
        });
      }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Utilisateur déconnecté: ${userId}`);

      // Retirer la socket de la liste
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          setUserOffline(userId);
          // Notifier que l'utilisateur est hors ligne
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });

  return io;
};

/**
 * Rejoint automatiquement les rooms des conversations actives de l'utilisateur
 * @param {Object} socket - Socket de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
const joinUserConversations = async (socket, userId) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    conversations.forEach((conv) => {
      socket.join(`conversation:${conv.id}`);
    });

    console.log(`[WebSocket] ${userId} a rejoint ${conversations.length} conversations`);
  } catch (error) {
    console.error('[WebSocket] Erreur lors de la jointure des conversations:', error);
  }
};

/**
 * Obtient l'instance Socket.IO
 * @returns {SocketIOServer|null} - Instance Socket.IO
 */
export const getIO = () => {
  return io;
};

/**
 * Émet un événement à une conversation spécifique
 * @param {string} conversationId - ID de la conversation
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
export const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

/**
 * Émet un événement à un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit(event, data);
      });
    }
  }
};

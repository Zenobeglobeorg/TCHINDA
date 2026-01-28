/**
 * Service de chat - Logique métier pour les conversations et messages
 */

import { prisma } from '../../utils/prisma.js';
import { translateToMultipleLanguages } from './translation.service.js';
import { setUserOnline, setUserOffline } from './presence.service.js';

/**
 * Vérifie si deux utilisateurs peuvent avoir une conversation
 * @param {string} userId1 - ID du premier utilisateur
 * @param {string} userId2 - ID du deuxième utilisateur
 * @param {string} type - Type de conversation (ORDER, DELIVERY, SUPPORT)
 * @returns {Promise<boolean>} - true si autorisé
 */
export const canUsersChat = async (userId1, userId2, type) => {
  // Récupérer les types de comptes
  const user1 = await prisma.user.findUnique({
    where: { id: userId1 },
    select: { accountType: true },
  });
  
  const user2 = await prisma.user.findUnique({
    where: { id: userId2 },
    select: { accountType: true },
  });

  if (!user1 || !user2) {
    return false;
  }

  const type1 = user1.accountType;
  const type2 = user2.accountType;

  // Règles d'autorisation selon le type de conversation
  switch (type) {
    case 'ORDER':
    case 'DELIVERY':
      // BUYER ↔ SELLER
      // BUYER ↔ DELIVERY
      // SELLER ↔ DELIVERY
      return (
        (type1 === 'BUYER' && (type2 === 'SELLER' || type2 === 'DELIVERY')) ||
        (type1 === 'SELLER' && (type2 === 'BUYER' || type2 === 'DELIVERY')) ||
        (type1 === 'DELIVERY' && (type2 === 'BUYER' || type2 === 'SELLER'))
      );

    case 'SUPPORT':
      // USER ↔ SUPPORT (ADMIN, MODERATOR, COMMERCIAL)
      const supportTypes = ['ADMIN', 'MODERATOR', 'COMMERCIAL'];
      return (
        supportTypes.includes(type1) || supportTypes.includes(type2)
      );

    default:
      return false;
  }
};

/**
 * Crée une nouvelle conversation
 * @param {Object} data - Données de la conversation
 * @param {string} data.participant1Id - ID du premier participant
 * @param {string} data.participant2Id - ID du deuxième participant
 * @param {string} data.type - Type de conversation
 * @param {string} [data.orderId] - ID de la commande (optionnel)
 * @param {string} [data.deliveryId] - ID de la livraison (optionnel)
 * @param {string} [data.supportTicketId] - ID du ticket support (optionnel)
 * @returns {Promise<Object>} - Conversation créée
 */
export const createConversation = async (data) => {
  const { participant1Id, participant2Id, type, orderId, deliveryId, supportTicketId } = data;

  // Vérifier les autorisations
  const canChat = await canUsersChat(participant1Id, participant2Id, type);
  if (!canChat) {
    throw new Error('Ces utilisateurs ne peuvent pas avoir une conversation de ce type');
  }

  // Vérifier si une conversation existe déjà
  const existing = await prisma.conversation.findFirst({
    where: {
      type,
      OR: [
        { participant1Id, participant2Id },
        { participant1Id: participant2Id, participant2Id: participant1Id },
      ],
      ...(orderId && { orderId }),
      ...(deliveryId && { deliveryId }),
      ...(supportTicketId && { supportTicketId }),
    },
  });

  if (existing) {
    return existing;
  }

  // Créer la conversation
  const conversation = await prisma.conversation.create({
    data: {
      type,
      participant1Id,
      participant2Id,
      orderId,
      deliveryId,
      supportTicketId,
      status: 'ACTIVE',
    },
    include: {
      participant1: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true,
          accountType: true,
        },
      },
      participant2: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true,
          accountType: true,
        },
      },
    },
  });

  // Log d'audit
  await prisma.chatAuditLog.create({
    data: {
      conversationId: conversation.id,
      action: 'CREATE_CONVERSATION',
      performedBy: participant1Id,
      targetUserId: participant2Id,
      details: {
        type,
        orderId,
        deliveryId,
        supportTicketId,
      },
    },
  });

  return conversation;
};

/**
 * Envoie un message dans une conversation
 * @param {Object} data - Données du message
 * @param {string} data.conversationId - ID de la conversation
 * @param {string} data.senderId - ID de l'expéditeur
 * @param {string} data.content - Contenu du message
 * @param {string} [data.language] - Langue du message
 * @param {string} [data.replyToId] - ID du message auquel répondre
 * @returns {Promise<Object>} - Message créé
 */
export const sendMessage = async (data) => {
  const { conversationId, senderId, content, language = 'fr', replyToId } = data;

  // Vérifier que la conversation existe et que l'utilisateur y participe
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error('Conversation non trouvée');
  }

  if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
    throw new Error('Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation');
  }

  if (conversation.status !== 'ACTIVE') {
    throw new Error('Cette conversation n\'est plus active');
  }

  // Déterminer les langues cibles pour la traduction
  const targetUserId = conversation.participant1Id === senderId 
    ? conversation.participant2Id 
    : conversation.participant1Id;
  
  const targetUser = conversation.participant1Id === senderId 
    ? conversation.participant2 
    : conversation.participant1;

  // Récupérer la langue préférée du destinataire depuis le profil
  let targetLanguage = 'fr';
  if (targetUser) {
    // Essayer de récupérer depuis le profil buyer
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: targetUserId },
      select: { preferredLanguage: true },
    });
    targetLanguage = buyerProfile?.preferredLanguage || 'fr';
  }
  const languagesToTranslate = ['fr', 'en', 'es']; // Langues supportées

  // Traduire le message si nécessaire
  let translatedContent = null;
  if (content && content.trim()) {
    translatedContent = await translateToMultipleLanguages(
      content,
      language,
      languagesToTranslate
    );
  }

  // Créer le message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content || '',
      translatedContent,
      language,
      status: 'SENT',
      replyToId,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true,
          accountType: true,
        },
      },
      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      attachments: true,
    },
  });

  // Mettre à jour la conversation
  const isParticipant1 = conversation.participant1Id === senderId;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      lastMessageId: message.id,
      // Incrémenter le compteur de messages non lus pour l'autre participant
      ...(isParticipant1
        ? { unreadCount2: { increment: 1 } }
        : { unreadCount1: { increment: 1 } }),
    },
  });

  // Log d'audit
  await prisma.chatAuditLog.create({
    data: {
      conversationId,
      messageId: message.id,
      action: 'SEND_MESSAGE',
      performedBy: senderId,
      targetUserId,
      details: {
        hasContent: !!content,
        hasAttachments: false, // Sera mis à jour si des pièces jointes sont ajoutées
        replyToId,
      },
    },
  });

  return message;
};

/**
 * Marque les messages comme lus
 * @param {string} conversationId - ID de la conversation
 * @param {string} userId - ID de l'utilisateur qui lit
 * @returns {Promise<Object>} - Résultat de la mise à jour
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error('Conversation non trouvée');
  }

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    throw new Error('Vous n\'êtes pas autorisé à accéder à cette conversation');
  }

  // Marquer tous les messages non lus comme lus
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readBy: { not: { has: userId } },
    },
    data: {
      status: 'READ',
      readAt: new Date(),
      readBy: { push: userId },
    },
  });

  // Réinitialiser le compteur de messages non lus
  const isParticipant1 = conversation.participant1Id === userId;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(isParticipant1 ? { unreadCount1: 0 } : { unreadCount2: 0 }),
    },
  });

  return result;
};

/**
 * Récupère les messages d'une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {string} userId - ID de l'utilisateur qui demande
 * @param {Object} [options] - Options de pagination
 * @param {number} [options.limit=50] - Nombre de messages à récupérer
 * @param {string} [options.cursor] - Curseur pour la pagination
 * @returns {Promise<Object>} - Messages et métadonnées
 */
export const getConversationMessages = async (conversationId, userId, options = {}) => {
  const { limit = 50, cursor } = options;

  // Vérifier l'accès
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error('Conversation non trouvée');
  }

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    // Vérifier si c'est un admin/moderator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true },
    });

    if (!['ADMIN', 'MODERATOR'].includes(user?.accountType)) {
      throw new Error('Vous n\'êtes pas autorisé à accéder à cette conversation');
    }
  }

  // Construire la requête avec pagination
  const where = {
    conversationId,
    ...(cursor && { id: { lt: cursor } }),
  };

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true,
          accountType: true,
        },
      },
      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      attachments: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // Prendre un de plus pour savoir s'il y a une page suivante
  });

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    messages: data.reverse(), // Inverser pour avoir les plus anciens en premier
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

/**
 * Récupère les conversations d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [options] - Options de filtrage
 * @returns {Promise<Object[]>} - Liste des conversations
 */
export const getUserConversations = async (userId, options = {}) => {
  const { type, status = 'ACTIVE' } = options;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
      ...(type && { type }),
      ...(status && { status }),
    },
    include: {
      participant1: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true,
          accountType: true,
        },
      },
      participant2: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true,
          accountType: true,
        },
      },
      lastMessage: {
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return conversations;
};

/**
 * Signale un message
 * @param {Object} data - Données du signalement
 * @param {string} data.messageId - ID du message
 * @param {string} data.reportedById - ID de l'utilisateur qui signale
 * @param {string} data.reason - Raison du signalement
 * @param {string} [data.description] - Description détaillée
 * @returns {Promise<Object>} - Signalement créé
 */
export const reportMessage = async (data) => {
  const { messageId, reportedById, reason, description } = data;

  // Vérifier que le message existe
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    throw new Error('Message non trouvé');
  }

  // Vérifier que l'utilisateur peut signaler ce message
  const canReport = 
    message.conversation.participant1Id === reportedById ||
    message.conversation.participant2Id === reportedById;

  if (!canReport) {
    throw new Error('Vous n\'êtes pas autorisé à signaler ce message');
  }

  // Créer le signalement
  const report = await prisma.messageReport.create({
    data: {
      messageId,
      conversationId: message.conversationId,
      reportedById,
      reason,
      description,
      status: 'PENDING',
    },
  });

  // Log d'audit
  await prisma.chatAuditLog.create({
    data: {
      conversationId: message.conversationId,
      messageId,
      action: 'REPORT_MESSAGE',
      performedBy: reportedById,
      targetUserId: message.senderId,
      details: {
        reason,
        description,
      },
    },
  });

  return report;
};

/**
 * Supprime un message (soft delete)
 * @param {string} messageId - ID du message
 * @param {string} userId - ID de l'utilisateur qui supprime
 * @returns {Promise<Object>} - Message mis à jour
 */
export const deleteMessage = async (messageId, userId) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    throw new Error('Message non trouvé');
  }

  // Vérifier les permissions (expéditeur ou admin/moderator)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountType: true },
  });

  const canDelete = 
    message.senderId === userId ||
    ['ADMIN', 'MODERATOR'].includes(user?.accountType);

  if (!canDelete) {
    throw new Error('Vous n\'êtes pas autorisé à supprimer ce message');
  }

  // Soft delete
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
      content: '[Message supprimé]',
    },
  });

  // Log d'audit
  await prisma.chatAuditLog.create({
    data: {
      conversationId: message.conversationId,
      messageId,
      action: 'DELETE_MESSAGE',
      performedBy: userId,
      targetUserId: message.senderId,
    },
  });

  return updated;
};

/**
 * Crée un log d'audit pour le chat
 * @param {Object} data - Données du log
 * @returns {Promise<Object>} - Log créé
 */
export const createChatAuditLog = async (data) => {
  return await prisma.chatAuditLog.create({
    data: {
      conversationId: data.conversationId,
      messageId: data.messageId,
      action: data.action,
      performedBy: data.performedBy,
      targetUserId: data.targetUserId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
};

/**
 * Middlewares spécifiques au module de chat
 */

import { prisma } from '../utils/prisma.js';
import { canUsersChat } from '../services/chat/chat.service.js';

/**
 * Vérifie que l'utilisateur peut accéder à une conversation
 */
export const canAccessConversation = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.userId;
    const accountType = req.accountType;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation non trouvée' },
      });
    }

    // Vérifier si l'utilisateur est participant
    const isParticipant = 
      conversation.participant1Id === userId || 
      conversation.participant2Id === userId;

    // Vérifier si c'est un admin/moderator (accès en lecture)
    const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(accountType);

    if (!isParticipant && !isAdminOrModerator) {
      return res.status(403).json({
        success: false,
        error: { message: 'Accès non autorisé à cette conversation' },
      });
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie que l'utilisateur peut créer une conversation avec un autre utilisateur
 */
export const canCreateConversation = async (req, res, next) => {
  try {
    const { participant2Id, type } = req.body;
    const participant1Id = req.userId;

    if (!participant2Id || !type) {
      return res.status(400).json({
        success: false,
        error: { message: 'participant2Id et type sont requis' },
      });
    }

    // Vérifier les autorisations
    const canChat = await canUsersChat(participant1Id, participant2Id, type);
    if (!canChat) {
      return res.status(403).json({
        success: false,
        error: { message: 'Vous n\'êtes pas autorisé à créer une conversation de ce type avec cet utilisateur' },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie que l'utilisateur peut envoyer un message dans une conversation
 */
export const canSendMessage = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation non trouvée' },
      });
    }

    // Vérifier que l'utilisateur est participant
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation' },
      });
    }

    // Vérifier que la conversation est active
    if (conversation.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: { message: 'Cette conversation n\'est plus active' },
      });
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie que l'utilisateur peut signaler un message
 */
export const canReportMessage = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.userId;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message non trouvé' },
      });
    }

    // Vérifier que l'utilisateur est participant à la conversation
    const isParticipant = 
      message.conversation.participant1Id === userId ||
      message.conversation.participant2Id === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: { message: 'Vous n\'êtes pas autorisé à signaler ce message' },
      });
    }

    req.message = message;
    next();
  } catch (error) {
    next(error);
  }
};

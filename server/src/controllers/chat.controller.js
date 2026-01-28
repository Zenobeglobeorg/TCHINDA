/**
 * Controllers pour le module de chat
 */

import {
  createConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  reportMessage,
  deleteMessage,
  markMessagesAsRead,
} from '../services/chat/chat.service.js';
import { emitToConversation } from '../services/chat/websocket.service.js';
import { prisma } from '../utils/prisma.js';

/**
 * Recherche des utilisateurs pour démarrer une conversation
 * GET /api/chat/users/search
 */
export const searchUsersController = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'La recherche doit contenir au moins 2 caractères' },
      });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
        // Exclure l'utilisateur actuel
        id: { not: req.userId },
        // Inclure tous les types de comptes pour le chat
        accountStatus: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photo: true,
        accountType: true,
      },
      take: parseInt(limit),
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère une conversation par ID
 * GET /api/chat/conversation/:id
 */
export const getConversationController = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation non trouvée' },
      });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant = 
      conversation.participant1Id === userId || 
      conversation.participant2Id === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: { message: 'Accès non autorisé à cette conversation' },
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crée une nouvelle conversation
 * POST /api/chat/conversation
 */
export const createConversationController = async (req, res, next) => {
  try {
    const { participant2Id, type, orderId, deliveryId, supportTicketId } = req.body;
    const participant1Id = req.userId;

    if (!participant2Id || !type) {
      return res.status(400).json({
        success: false,
        error: { message: 'participant2Id et type sont requis' },
      });
    }

    const conversation = await createConversation({
      participant1Id,
      participant2Id,
      type,
      orderId,
      deliveryId,
      supportTicketId,
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les conversations de l'utilisateur
 * GET /api/chat/conversations
 */
export const getConversationsController = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const userId = req.userId;

    const conversations = await getUserConversations(userId, { type, status });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les messages d'une conversation
 * GET /api/chat/conversation/:id/messages
 */
export const getMessagesController = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const { limit, cursor } = req.query;
    const userId = req.userId;

    const result = await getConversationMessages(conversationId, userId, {
      limit: limit ? parseInt(limit) : 50,
      cursor,
    });

    res.json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Envoie un message dans une conversation
 * POST /api/chat/conversation/:id/message
 */
export const sendMessageController = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const { content, language, replyToId } = req.body;
    const senderId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le contenu du message est requis' },
      });
    }

    const message = await sendMessage({
      conversationId,
      senderId,
      content,
      language,
      replyToId,
    });

    // Émettre via WebSocket
    emitToConversation(conversationId, 'message:new', { message });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marque les messages comme lus
 * POST /api/chat/conversation/:id/read
 */
export const markAsReadController = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.userId;

    await markMessagesAsRead(conversationId, userId);

    // Notifier via WebSocket
    emitToConversation(conversationId, 'messages:read', {
      conversationId,
      readBy: userId,
    });

    res.json({
      success: true,
      message: 'Messages marqués comme lus',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Signale un message
 * POST /api/chat/message/:id/report
 */
export const reportMessageController = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { reason, description } = req.body;
    const reportedById = req.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'La raison du signalement est requise' },
      });
    }

    const report = await reportMessage({
      messageId,
      reportedById,
      reason,
      description,
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Message signalé avec succès',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprime un message
 * DELETE /api/chat/message/:id
 */
export const deleteMessageController = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.userId;

    const message = await deleteMessage(messageId, userId);

    // Récupérer la conversation pour notifier via WebSocket
    const messageData = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });

    if (messageData) {
      emitToConversation(messageData.conversationId, 'message:deleted', {
        messageId,
        deletedBy: userId,
      });
    }

    res.json({
      success: true,
      data: message,
      message: 'Message supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les signalements (Admin/Moderator uniquement)
 * GET /api/chat/reports
 */
export const getReportsController = async (req, res, next) => {
  try {
    const { status, limit = 50, cursor } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    const reports = await prisma.messageReport.findMany({
      where,
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        conversation: {
          select: {
            id: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) + 1,
    });

    const hasMore = reports.length > parseInt(limit);
    const data = hasMore ? reports.slice(0, parseInt(limit)) : reports;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    res.json({
      success: true,
      data,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Traite un signalement (Admin/Moderator uniquement)
 * PATCH /api/chat/report/:id
 */
export const updateReportController = async (req, res, next) => {
  try {
    const { id: reportId } = req.params;
    const { status, reviewNotes } = req.body;
    const reviewedBy = req.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le statut est requis' },
      });
    }

    const report = await prisma.messageReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    // Log d'audit
    await prisma.chatAuditLog.create({
      data: {
        conversationId: report.conversationId,
        messageId: report.messageId,
        action: 'REVIEW_REPORT',
        performedBy: reviewedBy,
        targetUserId: report.reportedById,
        details: {
          status,
          reviewNotes,
        },
      },
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les logs d'audit (Admin uniquement)
 * GET /api/chat/audit-logs
 */
export const getAuditLogsController = async (req, res, next) => {
  try {
    const { conversationId, messageId, action, limit = 100, cursor } = req.query;

    const where = {};
    if (conversationId) where.conversationId = conversationId;
    if (messageId) where.messageId = messageId;
    if (action) where.action = action;
    if (cursor) where.id = { lt: cursor };

    const logs = await prisma.chatAuditLog.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            type: true,
          },
        },
        message: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) + 1,
    });

    const hasMore = logs.length > parseInt(limit);
    const data = hasMore ? logs.slice(0, parseInt(limit)) : logs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    res.json({
      success: true,
      data,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
};

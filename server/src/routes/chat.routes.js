/**
 * Routes pour le module de chat
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAccountType } from '../middleware/auth.middleware.js';
import {
  canCreateConversation,
  canAccessConversation,
  canSendMessage,
  canReportMessage,
} from '../middleware/chat.middleware.js';
import {
  createConversationController,
  getConversationController,
  getConversationsController,
  getMessagesController,
  sendMessageController,
  markAsReadController,
  reportMessageController,
  deleteMessageController,
  getReportsController,
  updateReportController,
  getAuditLogsController,
  searchUsersController,
} from '../controllers/chat.controller.js';

const router = express.Router();

// Rate limiting pour le chat (plus permissif que l'auth)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requêtes par minute
  message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer l'authentification et le rate limiting à toutes les routes
router.use(authenticate);
router.use(chatLimiter);

// Routes pour les conversations
router.post(
  '/conversation',
  canCreateConversation,
  createConversationController
);

router.get(
  '/conversation/:id',
  canAccessConversation,
  getConversationController
);

router.get(
  '/conversations',
  getConversationsController
);

// Route pour rechercher des utilisateurs
router.get(
  '/users/search',
  searchUsersController
);

router.get(
  '/conversation/:id/messages',
  canAccessConversation,
  getMessagesController
);

router.post(
  '/conversation/:id/message',
  canSendMessage,
  sendMessageController
);

router.post(
  '/conversation/:id/read',
  canAccessConversation,
  markAsReadController
);

// Routes pour les messages
router.delete(
  '/message/:id',
  deleteMessageController
);

router.post(
  '/message/:id/report',
  canReportMessage,
  reportMessageController
);

// Routes pour les signalements (Admin/Moderator uniquement)
router.get(
  '/reports',
  requireAccountType('ADMIN', 'MODERATOR'),
  getReportsController
);

router.patch(
  '/report/:id',
  requireAccountType('ADMIN', 'MODERATOR'),
  updateReportController
);

// Routes pour les logs d'audit (Admin uniquement)
router.get(
  '/audit-logs',
  requireAccountType('ADMIN'),
  getAuditLogsController
);

export default router;

/**
 * Service WebSocket pour le chat temps réel
 * Wrapper autour de socket.service.ts pour simplifier l'utilisation
 */

import { socketService } from './socket.service';
import { Message, Conversation } from './chat.service';

class ChatSocketService {
  /**
   * Connecter au serveur WebSocket
   */
  async connect(): Promise<boolean> {
    return socketService.connect();
  }

  /**
   * Déconnecter
   */
  disconnect() {
    socketService.disconnect();
  }

  /**
   * Vérifier si connecté
   */
  get connected(): boolean {
    return socketService.connected;
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId: string) {
    return socketService.joinConversation(conversationId);
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string) {
    return socketService.leaveConversation(conversationId);
  }

  /**
   * Envoyer un message
   */
  sendMessage(data: {
    conversationId: string;
    content?: string;
    language?: string;
    attachmentUrls?: string[];
    replyToId?: string;
  }) {
    return socketService.sendMessage(data);
  }

  /**
   * Marquer des messages comme lus
   */
  markAsRead(conversationId: string, messageIds: string[]) {
    return socketService.markAsRead(conversationId, messageIds);
  }

  /**
   * Indiquer que l'utilisateur est en train d'écrire
   */
  startTyping(conversationId: string) {
    return socketService.startTyping(conversationId);
  }

  /**
   * Arrêter l'indicateur de frappe
   */
  stopTyping(conversationId: string) {
    return socketService.stopTyping(conversationId);
  }

  /**
   * Écouter les nouveaux messages
   */
  onMessageNew(callback: (message: Message) => void) {
    return socketService.on('message:new', callback);
  }

  /**
   * Écouter les messages lus
   */
  onMessagesRead(callback: (data: { messageIds: string[]; readerId: string }) => void) {
    return socketService.on('messages:read', callback);
  }

  /**
   * Écouter les messages supprimés
   */
  onMessageDeleted(callback: (data: { messageId: string }) => void) {
    return socketService.on('message:deleted', callback);
  }

  /**
   * Écouter les changements de présence (en ligne/hors ligne)
   */
  onUserOnline(callback: (data: { userId: string }) => void) {
    return socketService.on('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void) {
    return socketService.on('user:offline', callback);
  }

  /**
   * Écouter les indicateurs de frappe
   */
  onTypingStart(callback: (data: { userId: string; conversationId: string }) => void) {
    return socketService.on('typing:start', callback);
  }

  onTypingStop(callback: (data: { userId: string; conversationId: string }) => void) {
    return socketService.on('typing:stop', callback);
  }

  /**
   * Écouter les conversations chargées
   */
  onConversationsLoad(callback: (conversations: Conversation[]) => void) {
    return socketService.on('conversations:load', callback);
  }

  /**
   * Écouter les erreurs
   */
  onError(callback: (error: { message: string }) => void) {
    return socketService.on('error', callback);
  }
}

export const chatSocket = new ChatSocketService();

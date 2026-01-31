/**
 * Service API REST pour le chat
 * Centralise toutes les requêtes HTTP vers le backend
 */

import { apiService } from './api.service';
import { Conversation, Message, MessageReport } from './chat.service';

export interface CreateConversationParams {
  participant2Id: string;
  type: 'ORDER' | 'DELIVERY' | 'SUPPORT';
  orderId?: string;
  deliveryId?: string;
  supportTicketId?: string;
}

export interface SendMessageParams {
  conversationId: string;
  content?: string;
  language?: string;
  attachmentUrls?: string[];
  replyToId?: string;
}

class ChatApiService {
  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  async getConversations(): Promise<{ success: boolean; data?: Conversation[]; error?: string }> {
    const response = await apiService.get<Conversation[]>('/api/chat/conversations');
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message,
    };
  }

  /**
   * Récupérer une conversation par ID
   */
  async getConversation(conversationId: string): Promise<{ success: boolean; data?: Conversation; error?: string }> {
    const response = await apiService.get<Conversation>(`/api/chat/conversation/${conversationId}`);
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message,
    };
  }

  /**
   * Créer ou récupérer une conversation
   */
  async createOrGetConversation(
    params: CreateConversationParams
  ): Promise<{ success: boolean; data?: Conversation; error?: string }> {
    const response = await apiService.post<Conversation>('/api/chat/conversation', params);
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message,
    };
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<{ success: boolean; data?: Message[]; error?: string }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    const response = await apiService.get<Message[]>(`/api/chat/conversation/${conversationId}/messages?${params}`);
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message,
    };
  }

  /**
   * Envoyer un message (fallback REST si WebSocket échoue)
   */
  async sendMessage(params: SendMessageParams): Promise<{ success: boolean; data?: Message; error?: string }> {
    const response = await apiService.post<Message>('/api/chat/message', params);
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message,
    };
  }

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(
    conversationId: string,
    messageIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const response = await apiService.post(`/api/chat/conversation/${conversationId}/read`, { messageIds });
    return {
      success: response.success,
      error: response.error?.message,
    };
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiService.delete(`/api/chat/message/${messageId}`);
    return {
      success: response.success,
      error: response.error?.message,
    };
  }

  /**
   * Signaler un message
   */
  async reportMessage(
    messageId: string,
    reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'SCAM' | 'OTHER',
    description?: string
  ): Promise<{ success: boolean; data?: MessageReport; error?: string }> {
    const response = await apiService.post<MessageReport>(`/api/chat/message/${messageId}/report`, {
      reason,
      description,
    });
    return {
      success: response.success,
      data: response.data,
      error: response.error?.message,
    };
  }
}

export const chatApi = new ChatApiService();

/**
 * Service API pour le module de chat
 * Gère toutes les interactions REST avec le backend
 */

import { apiService } from './api.service';
import { API_CONFIG } from '@/constants/config';

// Types pour le chat
export interface Conversation {
  id: string;
  type: 'ORDER' | 'DELIVERY' | 'SUPPORT';
  orderId?: string;
  deliveryId?: string;
  supportTicketId?: string;
  participant1: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    accountType: string;
  };
  participant2: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    accountType: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    accountType: string;
  };
  content: string;
  translatedContent?: Record<string, string>; // { fr: "...", en: "..." }
  language: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'EDITED' | 'DELETED';
  readBy: string[];
  readAt?: string;
  attachments?: Attachment[];
  replyTo?: Message;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface MessageReport {
  id: string;
  messageId: string;
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'SCAM' | 'OTHER';
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

interface CreateConversationParams {
  participant2Id: string;
  type: 'ORDER' | 'DELIVERY' | 'SUPPORT';
  orderId?: string;
  deliveryId?: string;
  supportTicketId?: string;
}

interface SendMessageParams {
  conversationId: string;
  content?: string;
  language?: string;
  attachmentUrls?: string[];
  replyToId?: string;
}

interface ReportMessageParams {
  messageId: string;
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'SCAM' | 'OTHER';
  description?: string;
}

class ChatService {
  private baseURL = API_CONFIG.BASE_URL;

  /**
   * Créer ou récupérer une conversation
   */
  async createOrGetConversation(params: CreateConversationParams) {
    return apiService.post<Conversation>('/api/chat/conversation', params);
  }

  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  async getConversations() {
    return apiService.get<Conversation[]>('/api/chat/conversations');
  }

  /**
   * Récupérer une conversation par ID
   */
  async getConversation(conversationId: string) {
    return apiService.get<Conversation>(`/api/chat/conversation/${conversationId}`);
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(conversationId: string, limit = 50, before?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    return apiService.get<Message[]>(`/api/chat/conversation/${conversationId}/messages?${params}`);
  }

  /**
   * Envoyer un message (via REST, pour fallback si WebSocket échoue)
   */
  async sendMessage(params: SendMessageParams) {
    return apiService.post<Message>('/api/chat/message', params);
  }

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(conversationId: string, messageIds: string[]) {
    return apiService.post(`/api/chat/conversation/${conversationId}/read`, { messageIds });
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId: string) {
    return apiService.delete(`/api/chat/message/${messageId}`);
  }

  /**
   * Signaler un message
   */
  async reportMessage(params: ReportMessageParams) {
    return apiService.post<MessageReport>(`/api/chat/message/${params.messageId}/report`, {
      reason: params.reason,
      description: params.description,
    });
  }

  /**
   * Rechercher des utilisateurs par nom
   */
  async searchUsers(query: string, limit = 20) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return apiService.get<Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      photo?: string;
      accountType: string;
      isOnline?: boolean;
    }>>(`/api/users/search?${params}`);
  }

  /**
   * Upload une pièce jointe (image, document, etc.)
   * TODO: Intégrer avec le service d'upload existant
   */
  async uploadAttachment(file: any, type: 'image' | 'document' | 'video' | 'audio'): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // TODO: Utiliser le service d'upload existant ou créer un endpoint dédié
      const response = await apiService.upload<{ url: string }>('/api/chat/upload', formData);
      
      if (response.success && response.data) {
        return { success: true, url: response.data.url };
      }
      
      return { success: false, error: response.error?.message || 'Erreur lors de l\'upload' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de l\'upload' };
    }
  }
}

export const chatService = new ChatService();

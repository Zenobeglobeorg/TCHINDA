/**
 * Service WebSocket pour le chat temps réel
 * Utilise Socket.IO pour la communication bidirectionnelle
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, Conversation } from './chat.service';

// Types pour les événements Socket.IO
export interface SocketEvents {
  // Client → Server
  'conversation:join': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;
  'message:send': (data: {
    conversationId: string;
    content?: string;
    language?: string;
    attachmentUrls?: string[];
    replyToId?: string;
  }) => void;
  'messages:read': (data: { conversationId: string; messageIds: string[] }) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;

  // Server → Client
  'message:new': (message: Message) => void;
  'messages:read': (data: { messageIds: string[]; readerId: string }) => void;
  'message:deleted': (data: { messageId: string }) => void;
  'user:online': (data: { userId: string }) => void;
  'user:offline': (data: { userId: string }) => void;
  'typing:start': (data: { userId: string; conversationId: string }) => void;
  'typing:stop': (data: { userId: string; conversationId: string }) => void;
  'conversations:load': (conversations: Conversation[]) => void;
  'error': (error: { message: string }) => void;
  'auth:error': (error: { message: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Initialiser la connexion WebSocket
   */
  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    try {
      // Récupérer le token JWT
      const token = await AsyncStorage.getItem('@tchinda_token');
      if (!token) {
        console.warn('[Socket] Pas de token JWT disponible');
        return false;
      }

      // Construire l'URL WebSocket (même base que l'API)
      const wsUrl = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '').split('/')[0];
      const protocol = API_CONFIG.BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const socketUrl = `${protocol}://${wsUrl}`;

      // Créer la connexion Socket.IO
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'], // Fallback sur polling si WebSocket échoue
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Événements de connexion
      this.socket.on('connect', () => {
        console.log('[Socket] Connecté au serveur de chat');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emitLocal('socket:connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Déconnecté:', reason);
        this.isConnected = false;
        this.emitLocal('socket:disconnected', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Erreur de connexion:', error.message);
        this.reconnectAttempts++;
        this.emitLocal('socket:error', error);
      });

      // Événements du chat (serveur envoie le message directement ou { message })
      this.socket.on('message:new', (payload: Message | { message: Message }) => {
        const message = payload && typeof payload === 'object' && 'message' in payload
          ? (payload as { message: Message }).message
          : (payload as Message);
        this.emitLocal('message:new', message);
      });

      this.socket.on('messages:read', (data: { conversationId?: string; readBy?: string; messageIds?: string[]; readerId?: string }) => {
        this.emitLocal('messages:read', data);
      });

      this.socket.on('message:deleted', (data: { messageId: string }) => {
        this.emitLocal('message:deleted', data);
      });

      this.socket.on('user:online', (data: { userId: string }) => {
        this.emitLocal('user:online', data);
      });

      this.socket.on('user:offline', (data: { userId: string }) => {
        this.emitLocal('user:offline', data);
      });

      this.socket.on('typing:start', (data: { userId: string; conversationId: string }) => {
        this.emitLocal('typing:start', data);
      });

      this.socket.on('typing:stop', (data: { userId: string; conversationId: string }) => {
        this.emitLocal('typing:stop', data);
      });

      this.socket.on('conversations:load', (conversations: Conversation[]) => {
        this.emitLocal('conversations:load', conversations);
      });

      this.socket.on('error', (error: { message: string }) => {
        console.error('[Socket] Erreur:', error);
        this.emitLocal('error', error);
      });

      this.socket.on('auth:error', (error: { message: string }) => {
        console.error('[Socket] Erreur d\'authentification:', error);
        this.emitLocal('auth:error', error);
      });

      return true;
    } catch (error: any) {
      console.error('[Socket] Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Déconnecter le socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Vérifier si connecté
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Émettre un événement vers le serveur
   */
  emit(event: string, data?: any) {
    if (!this.socket || !this.isConnected) {
      console.warn(`[Socket] Tentative d'émission alors que non connecté: ${event}`);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  /**
   * Émettre un événement local (pour les listeners internes)
   */
  private emitLocal(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[Socket] Erreur dans le listener ${event}:`, error);
        }
      });
    }
  }

  /**
   * Écouter un événement du serveur
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Écouter aussi sur le socket réel
    if (this.socket) {
      this.socket.on(event, callback as any);
    }

    // Retourner une fonction pour se désabonner
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Se désabonner d'un événement
   */
  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    } else {
      // Supprimer tous les listeners pour cet événement
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    }
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId: string) {
    return this.emit('conversation:join', conversationId);
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string) {
    return this.emit('conversation:leave', conversationId);
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
    return this.emit('message:send', data);
  }

  /**
   * Marquer des messages comme lus
   */
  markAsRead(conversationId: string, messageIds: string[]) {
    return this.emit('messages:read', { conversationId, messageIds });
  }

  /**
   * Indiquer que l'utilisateur est en train d'écrire
   */
  startTyping(conversationId: string) {
    return this.emit('typing:start', conversationId);
  }

  /**
   * Arrêter l'indicateur de frappe
   */
  stopTyping(conversationId: string) {
    return this.emit('typing:stop', conversationId);
  }
}

// Instance singleton
export const socketService = new SocketService();

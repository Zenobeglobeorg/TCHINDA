/**
 * Hook personnalisé pour gérer le chat (conversations, messages, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, Conversation, Message } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { useAuth } from '@/contexts/AuthContext';

interface UseChatOptions {
  conversationId?: string;
  autoLoad?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { conversationId, autoLoad = true } = options;
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error?.message || 'Erreur lors du chargement des conversations');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (convId: string, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatService.getMessages(convId, limit);
      if (response.success && response.data) {
        setMessages(response.data.reverse()); // Inverser pour afficher du plus ancien au plus récent
      } else {
        setError(response.error?.message || 'Erreur lors du chargement des messages');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger une conversation spécifique
  const loadConversation = useCallback(async (convId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatService.getConversation(convId);
      if (response.success && response.data) {
        setCurrentConversation(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Conversation non trouvée');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la conversation');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Envoyer un message
  const sendMessage = useCallback(async (
    content?: string,
    language = 'fr',
    attachmentUrls: string[] = [],
    replyToId?: string
  ) => {
    if (!currentConversation) {
      setError('Aucune conversation sélectionnée');
      return false;
    }

    try {
      // Essayer d'envoyer via WebSocket d'abord
      if (socketService.connected) {
        socketService.sendMessage({
          conversationId: currentConversation.id,
          content,
          language,
          attachmentUrls,
          replyToId,
        });
        return true;
      } else {
        // Fallback sur REST
        const response = await chatService.sendMessage({
          conversationId: currentConversation.id,
          content,
          language,
          attachmentUrls,
          replyToId,
        });
        if (response.success && response.data) {
          setMessages((prev) => [...prev, response.data!]);
          return true;
        } else {
          setError(response.error?.message || 'Erreur lors de l\'envoi du message');
          return false;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
      return false;
    }
  }, [currentConversation]);

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!currentConversation) return;

    try {
      if (socketService.connected) {
        socketService.markAsRead(currentConversation.id, messageIds);
      } else {
        await chatService.markAsRead(currentConversation.id, messageIds);
      }

      // Mettre à jour localement
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) && !msg.readBy.includes(user?.id || '')
            ? {
                ...msg,
                readBy: [...msg.readBy, user?.id || ''],
                status: 'READ' as const,
              }
            : msg
        )
      );
    } catch (err: any) {
      console.error('Erreur lors du marquage comme lu:', err);
    }
  }, [currentConversation, user]);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await chatService.deleteMessage(messageId);
      if (response.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        return true;
      } else {
        setError(response.error?.message || 'Erreur lors de la suppression');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      return false;
    }
  }, []);

  // Signaler un message
  const reportMessage = useCallback(async (
    messageId: string,
    reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'SCAM' | 'OTHER',
    description?: string
  ) => {
    try {
      const response = await chatService.reportMessage({ messageId, reason, description });
      return response.success;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du signalement');
      return false;
    }
  }, []);

  // Indicateur de frappe
  const startTyping = useCallback(() => {
    if (!currentConversation) return;
    
    socketService.startTyping(currentConversation.id);
    
    // Arrêter automatiquement après 3 secondes
    const timeoutId = setTimeout(() => {
      socketService.stopTyping(currentConversation.id);
    }, 3000);
    
    const existingTimeout = typingTimeoutRef.current.get(currentConversation.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    typingTimeoutRef.current.set(currentConversation.id, timeoutId);
  }, [currentConversation]);

  const stopTyping = useCallback(() => {
    if (!currentConversation) return;
    
    const timeoutId = typingTimeoutRef.current.get(currentConversation.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      typingTimeoutRef.current.delete(currentConversation.id);
    }
    
    socketService.stopTyping(currentConversation.id);
  }, [currentConversation]);

  // Écouter les événements WebSocket
  useEffect(() => {
    if (!socketService.connected) return;

    const unsubscribeNewMessage = socketService.on('message:new', (message: Message) => {
      if (message.conversationId === currentConversation?.id) {
        setMessages((prev) => [...prev, message]);
        // Marquer automatiquement comme lu si c'est la conversation active
        if (user && message.senderId !== user.id) {
          markAsRead([message.id]);
        }
      }
      // Mettre à jour la liste des conversations
      loadConversations();
    });

    const unsubscribeMessagesRead = socketService.on('messages:read', (data: { messageIds: string[]; readerId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id) && !msg.readBy.includes(data.readerId)
            ? {
                ...msg,
                readBy: [...msg.readBy, data.readerId],
                status: 'READ' as const,
              }
            : msg
        )
      );
    });

    const unsubscribeMessageDeleted = socketService.on('message:deleted', (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    const unsubscribeUserOnline = socketService.on('user:online', (data: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    });

    const unsubscribeUserOffline = socketService.on('user:offline', (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    const unsubscribeTypingStart = socketService.on('typing:start', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === currentConversation?.id && data.userId !== user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    });

    const unsubscribeTypingStop = socketService.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === currentConversation?.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    const unsubscribeConversationsLoad = socketService.on('conversations:load', (convs: Conversation[]) => {
      setConversations(convs);
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessagesRead();
      unsubscribeMessageDeleted();
      unsubscribeUserOnline();
      unsubscribeUserOffline();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeConversationsLoad();
    };
  }, [currentConversation, user, loadConversations, markAsRead]);

  // Charger automatiquement si demandé
  useEffect(() => {
    if (autoLoad) {
      loadConversations();
    }
  }, [autoLoad, loadConversations]);

  // Charger la conversation et les messages si conversationId fourni
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId).then((conv) => {
        if (conv) {
          setCurrentConversation(conv);
          loadMessages(conv.id);
          socketService.joinConversation(conv.id);
        }
      });
    }

    return () => {
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, loadConversation, loadMessages]);

  return {
    conversations,
    messages,
    currentConversation,
    loading,
    error,
    typingUsers,
    onlineUsers,
    loadConversations,
    loadMessages,
    loadConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    reportMessage,
    startTyping,
    stopTyping,
    setCurrentConversation,
  };
}

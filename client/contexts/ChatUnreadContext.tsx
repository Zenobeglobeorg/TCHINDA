/**
 * Contexte pour le compteur de messages non lus (chat).
 * Utilisé pour afficher le badge sur la sidebar web et la barre d'onglets mobile.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { useAuth } from '@/contexts/AuthContext';

interface ChatUnreadContextValue {
  totalUnread: number;
  refreshUnread: () => Promise<void>;
}

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setTotalUnread(0);
      return;
    }
    try {
      const response = await chatService.getConversations();
      if (response.success && response.data) {
        const total = response.data.reduce((sum, c) => sum + ((c as any).unreadCount ?? 0), 0);
        setTotalUnread(total);
      }
    } catch {
      setTotalUnread(0);
    }
  }, [user]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    if (!user) return;

    const onMessageNew = (message: { senderId?: string }) => {
      if (message.senderId && message.senderId !== user.id) {
        setTotalUnread((prev) => prev + 1);
      }
    };

    const onMessagesRead = () => {
      refreshUnread();
    };

    socketService.on('message:new', onMessageNew);
    socketService.on('messages:read', onMessagesRead);

    return () => {
      socketService.off('message:new', onMessageNew);
      socketService.off('messages:read', onMessagesRead);
    };
  }, [user, refreshUnread]);

  return (
    <ChatUnreadContext.Provider value={{ totalUnread, refreshUnread }}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread(): ChatUnreadContextValue {
  const ctx = useContext(ChatUnreadContext);
  if (!ctx) {
    return {
      totalUnread: 0,
      refreshUnread: async () => {},
    };
  }
  return ctx;
}

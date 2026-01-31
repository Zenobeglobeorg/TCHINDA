/**
 * Écran de conversation individuelle
 * Utilisé sur mobile ou quand on clique sur une conversation
 */

import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loadConversation } = useChat({ conversationId: id, autoLoad: false });
  const { isConnected } = useSocket();

  useEffect(() => {
    if (id) {
      loadConversation(id);
    }
  }, [id, loadConversation]);

  const handleBack = () => {
    router.back();
  };

  if (!id) {
    return null;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ChatRoom conversationId={id} onBack={handleBack} />
    </ThemedView>
  );
}

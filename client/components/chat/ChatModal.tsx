/**
 * Composant modal pour afficher le chat
 * Peut être utilisé comme modal ou écran plein
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { ChatList } from './ChatList';
import { ChatRoom } from './ChatRoom';
import { useChat } from '@/hooks/useChat';
import { Conversation } from '@/services/chat.service';
import { IconSymbol } from '../ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  initialConversationId?: string;
  contextType?: 'ORDER' | 'DELIVERY' | 'SUPPORT';
  contextId?: string;
  targetUserId?: string;
}

export function ChatModal({
  visible,
  onClose,
  initialConversationId,
  contextType,
  contextId,
  targetUserId,
}: ChatModalProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { conversations, loadConversations, loading } = useChat({ autoLoad: true });
  const backgroundColor = useThemeColor({}, 'background');

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleClose = () => {
    setSelectedConversation(null);
    onClose();
  };

  // Si une conversation initiale est fournie, l'ouvrir directement
  React.useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === initialConversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [initialConversationId, conversations]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        {selectedConversation ? (
          <ChatRoom
            conversationId={selectedConversation.id}
            onBack={handleBack}
          />
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>Messages</ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Chat List */}
            <ChatList
              conversations={conversations}
              loading={loading}
              onRefresh={loadConversations}
              onConversationPress={handleConversationPress}
            />
          </>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});

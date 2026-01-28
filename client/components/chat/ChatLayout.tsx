/**
 * Layout principal du chat
 * Gère l'affichage desktop (liste + conversation) et mobile (liste ou conversation)
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ConversationList } from './ConversationList';
import { ChatRoom } from './ChatRoom';
import { UserSearch } from './UserSearch';
import { Conversation } from '@/services/chat.service';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '../ui/IconSymbol';

interface ChatLayoutProps {
  conversations: Conversation[];
  loading?: boolean;
  onRefresh?: () => void;
  onConversationPress: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onBack?: () => void;
  onUserSearch?: () => void;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export function ChatLayout({
  conversations,
  loading,
  onRefresh,
  onConversationPress,
  selectedConversationId,
  onBack,
  onUserSearch,
}: ChatLayoutProps) {
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>(selectedConversationId);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Synchroniser avec la prop externe
  React.useEffect(() => {
    setLocalSelectedId(selectedConversationId);
  }, [selectedConversationId]);

  // Sur mobile, afficher soit la liste soit la conversation
  // Sur desktop/tablet, afficher les deux côte à côte
  const showList = !isTablet || !localSelectedId;
  const showChat = localSelectedId && (isTablet || localSelectedId);

  const handleConversationPress = (conversation: Conversation) => {
    setLocalSelectedId(conversation.id);
    onConversationPress(conversation);
  };

  const handleBack = () => {
    setLocalSelectedId(undefined);
    if (onBack) onBack();
  };

  const handleUserSearchOpen = () => {
    setShowUserSearch(true);
    if (onUserSearch) onUserSearch();
  };

  return (
    <ThemedView style={styles.container}>
      {showList && (
        <View style={[styles.listContainer, isTablet && styles.listContainerTablet, { borderRightColor: borderColor }]}>
          {/* Header avec bouton de recherche */}
          <View style={[styles.listHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              onPress={handleUserSearchOpen}
              style={[styles.newChatButton, { backgroundColor: tintColor }]}
            >
              <IconSymbol name="person.badge.plus" size={18} color="#FFFFFF" />
              <ThemedText style={styles.newChatButtonText}>Nouveau</ThemedText>
            </TouchableOpacity>
          </View>
          <ConversationList
            conversations={conversations}
            loading={loading}
            onRefresh={onRefresh}
            onConversationPress={handleConversationPress}
            activeConversationId={localSelectedId}
          />
        </View>
      )}
      {showChat && localSelectedId && (
        <View style={[styles.chatContainer, isTablet && styles.chatContainerTablet]}>
          <ChatRoom conversationId={localSelectedId} onBack={!isTablet ? handleBack : undefined} />
        </View>
      )}

      {/* Modal de recherche d'utilisateurs */}
      <Modal
        visible={showUserSearch}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setShowUserSearch(false)}
      >
        <UserSearch
          onUserSelect={() => {
            setShowUserSearch(false);
            if (onRefresh) onRefresh();
          }}
          onClose={() => setShowUserSearch(false)}
        />
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      borderRightWidth: 1,
    }),
  },
  listContainerTablet: {
    width: 360,
    maxWidth: 360,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
      zIndex: 10,
      backgroundColor: '#FFFFFF',
    }),
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContainerTablet: {
    flex: 1,
  },
});

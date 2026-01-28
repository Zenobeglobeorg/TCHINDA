/**
 * Écran de chat pour seller
 * Affiche l'interface de chat dans le contexte seller
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Conversation } from '@/services/chat.service';
import { useRouter } from 'expo-router';

export default function SellerChatTab() {
  const router = useRouter();
  const { conversations, loading, loadConversations } = useChat({ autoLoad: true });
  const { isConnected } = useSocket();
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    // Sur mobile, naviguer vers l'écran de conversation
    if (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor }]}>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Messages</ThemedText>
        <View style={styles.headerRight}>
          {isConnected ? (
            <View style={[styles.statusIndicator, { backgroundColor: '#28A745' }]} />
          ) : (
            <View style={[styles.statusIndicator, { backgroundColor: '#DC3545' }]} />
          )}
        </View>
      </View>

      {/* Chat Layout */}
      <ChatLayout
        conversations={conversations}
        loading={loading}
        onRefresh={loadConversations}
        onConversationPress={handleConversationPress}
      />
    </ThemedView>
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
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

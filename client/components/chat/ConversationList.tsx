/**
 * Liste des conversations
 */

import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { ConversationItem } from './ConversationItem';
import { Conversation } from '@/services/chat.service';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '../ui/IconSymbol';

interface ConversationListProps {
  conversations: Conversation[];
  loading?: boolean;
  onRefresh?: () => void;
  onConversationPress: (conversation: Conversation) => void;
  activeConversationId?: string;
  emptyMessage?: string;
}

export function ConversationList({
  conversations,
  loading = false,
  onRefresh,
  onConversationPress,
  activeConversationId,
  emptyMessage = 'Aucune conversation',
}: ConversationListProps) {
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');

  if (loading && conversations.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={[styles.loadingText, { color: placeholderColor }]}>
          Chargement des conversations...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => onConversationPress(item)}
            isActive={item.id === activeConversationId}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="message" size={64} color={placeholderColor} />
            <ThemedText style={[styles.emptyText, { color: placeholderColor }]}>
              {emptyMessage}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

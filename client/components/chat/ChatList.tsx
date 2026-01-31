/**
 * Composant pour afficher la liste des conversations
 */

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Conversation } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '../ui/IconSymbol';

interface ChatListProps {
  conversations: Conversation[];
  loading?: boolean;
  onRefresh?: () => void;
  onConversationPress: (conversation: Conversation) => void;
  emptyMessage?: string;
}

export function ChatList({
  conversations,
  loading = false,
  onRefresh,
  onConversationPress,
  emptyMessage = 'Aucune conversation',
}: ChatListProps) {
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E5EA', dark: '#2C2C2E' }, 'background');

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant1.id === user?.id
      ? conversation.participant2
      : conversation.participant1;
  };

  const formatLastMessage = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'Aucun message';
    
    const message = conversation.lastMessage;
    if (message.attachments && message.attachments.length > 0) {
      return '📎 Pièce jointe';
    }
    return message.content || 'Message vide';
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(item);
    const isUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: borderColor }]}
        onPress={() => onConversationPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
          {otherParticipant.photo ? (
            <IconSymbol name="person.circle.fill" size={48} color="#007AFF" />
            // TODO: Utiliser une Image pour afficher la photo
          ) : (
            <IconSymbol name="person.circle.fill" size={48} color="#007AFF" />
          )}
          {isUnread && <View style={styles.unreadBadge} />}
        </View>

        {/* Contenu */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <ThemedText style={[styles.participantName, isUnread && styles.participantNameUnread]}>
              {otherParticipant.firstName} {otherParticipant.lastName}
            </ThemedText>
            <ThemedText style={styles.time}>{formatTime(item.lastMessage?.createdAt)}</ThemedText>
          </View>
          <View style={styles.conversationFooter}>
            <ThemedText
              style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {formatLastMessage(item)}
            </ThemedText>
            {isUnread && (
              <View style={styles.unreadCount}>
                <ThemedText style={styles.unreadCountText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Chargement des conversations...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="message" size={64} color="#999" />
            <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
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
    color: '#999',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarUnread: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantNameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  lastMessageUnread: {
    color: '#000',
    fontWeight: '500',
  },
  unreadCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#999',
    textAlign: 'center',
  },
});

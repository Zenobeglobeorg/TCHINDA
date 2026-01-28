/**
 * Composant pour afficher un élément de conversation dans la liste
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Conversation } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '../ui/IconSymbol';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  isActive?: boolean;
}

export function ConversationItem({ conversation, onPress, isActive = false }: ConversationItemProps) {
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');

  // Obtenir l'autre participant
  const otherParticipant = conversation.participant1.id === user?.id
    ? conversation.participant2
    : conversation.participant1;

  // Formater le dernier message
  const formatLastMessage = () => {
    if (!conversation.lastMessage) return 'Aucun message';
    const message = conversation.lastMessage;
    if (message.attachments && message.attachments.length > 0) {
      return '📎 Pièce jointe';
    }
    return message.content || 'Message vide';
  };

  // Formater l'heure
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

  const isUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isActive ? cardColor : backgroundColor,
          borderBottomColor: borderColor,
        },
        isActive && { borderLeftWidth: 3, borderLeftColor: tintColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, isUnread && { borderColor: tintColor, borderWidth: 2 }]}>
        {otherParticipant.photo ? (
          <IconSymbol name="person.circle.fill" size={48} color={tintColor} />
          // TODO: Utiliser Image pour afficher la photo réelle
        ) : (
          <IconSymbol name="person.circle.fill" size={48} color={tintColor} />
        )}
        {isUnread && <View style={[styles.unreadBadge, { backgroundColor: tintColor }]} />}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText
            style={[
              styles.name,
              { color: textColor },
              isUnread && styles.nameUnread,
            ]}
            numberOfLines={1}
          >
            {otherParticipant.firstName} {otherParticipant.lastName}
          </ThemedText>
          <ThemedText style={[styles.time, { color: placeholderColor }]}>
            {formatTime(conversation.lastMessage?.createdAt)}
          </ThemedText>
        </View>
        <View style={styles.footer}>
          <ThemedText
            style={[
              styles.lastMessage,
              { color: placeholderColor },
              isUnread && { color: textColor, fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {formatLastMessage()}
          </ThemedText>
          {isUnread && (
            <View style={[styles.unreadCount, { backgroundColor: tintColor }]}>
              <ThemedText style={styles.unreadCountText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
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
});

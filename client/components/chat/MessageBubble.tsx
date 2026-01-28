/**
 * Composant pour afficher une bulle de message
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Message } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '../ui/IconSymbol';

interface MessageBubbleProps {
  message: Message;
  onPress?: () => void;
  onLongPress?: () => void;
  onReport?: () => void;
  showTranslation?: boolean;
}

export function MessageBubble({
  message,
  onPress,
  onLongPress,
  onReport,
  showTranslation = false,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = message.senderId === user?.id;
  
  const backgroundColor = useThemeColor(
    { light: isOwn ? '#007AFF' : '#E5E5EA', dark: isOwn ? '#0A84FF' : '#2C2C2E' },
    'background'
  );
  
  const textColor = useThemeColor(
    { light: isOwn ? '#FFFFFF' : '#000000', dark: isOwn ? '#FFFFFF' : '#FFFFFF' },
    'text'
  );
  
  const borderColor = useThemeColor(
    { light: '#E5E5EA', dark: '#2C2C2E' },
    'background'
  );

  // Déterminer la langue à afficher (préférer la traduction si disponible)
  const displayContent = showTranslation && message.translatedContent
    ? message.translatedContent[message.language] || message.content
    : message.content;

  // Format de l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={[
          styles.bubble,
          {
            backgroundColor,
            borderColor,
          },
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        {/* Message de réponse (si applicable) */}
        {message.replyTo && (
          <View style={[styles.replyContainer, { borderLeftColor: textColor }]}>
            <ThemedText style={[styles.replyAuthor, { color: textColor }]}>
              {message.replyTo.sender.firstName} {message.replyTo.sender.lastName}
            </ThemedText>
            <ThemedText style={[styles.replyContent, { color: textColor }]} numberOfLines={1}>
              {message.replyTo.content}
            </ThemedText>
          </View>
        )}

        {/* Contenu du message */}
        {message.content && (
          <ThemedText style={[styles.content, { color: textColor }]}>
            {displayContent}
          </ThemedText>
        )}

        {/* Indicateur de traduction */}
        {showTranslation && message.translatedContent && (
          <View style={styles.translationBadge}>
            <IconSymbol name="globe" size={10} color={textColor} />
            <ThemedText style={[styles.translationText, { color: textColor }]}>
              Traduit
            </ThemedText>
          </View>
        )}

        {/* Pièces jointes */}
        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </View>
        )}

        {/* Footer avec heure et statut */}
        <View style={styles.footer}>
          <ThemedText style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.7)' : '#999' }]}>
            {formatTime(message.createdAt)}
          </ThemedText>
          {isOwn && (
            <View style={styles.statusContainer}>
              {message.status === 'READ' ? (
                <IconSymbol name="checkmark.circle.fill" size={12} color={textColor} />
              ) : message.status === 'DELIVERED' ? (
                <IconSymbol name="checkmark.circle" size={12} color={textColor} />
              ) : (
                <IconSymbol name="circle" size={12} color={textColor} />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Menu d'actions (si long press) */}
      {onReport && !isOwn && (
        <TouchableOpacity style={styles.reportButton} onPress={onReport}>
          <IconSymbol name="exclamationmark.triangle" size={16} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Composant pour prévisualiser une pièce jointe
function AttachmentPreview({ attachment }: { attachment: any }) {
  // TODO: Implémenter la prévisualisation selon le type (image, document, etc.)
  return (
    <View style={styles.attachmentContainer}>
      <ThemedText style={styles.attachmentText}>
        📎 {attachment.fileName || 'Pièce jointe'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  replyContainer: {
    paddingLeft: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
    opacity: 0.7,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyContent: {
    fontSize: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 20,
  },
  translationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  translationText: {
    fontSize: 10,
    opacity: 0.7,
  },
  attachmentsContainer: {
    marginTop: 8,
    gap: 8,
  },
  attachmentContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  attachmentText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButton: {
    marginTop: 4,
    padding: 4,
  },
});

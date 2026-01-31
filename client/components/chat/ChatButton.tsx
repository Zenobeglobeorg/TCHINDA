/**
 * Bouton pour ouvrir le chat
 * Peut être utilisé partout dans l'application
 */

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ChatModal } from './ChatModal';
import { IconSymbol } from '../ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ChatButtonProps {
  conversationId?: string;
  contextType?: 'ORDER' | 'DELIVERY' | 'SUPPORT';
  contextId?: string;
  targetUserId?: string;
  variant?: 'icon' | 'button' | 'badge';
  badgeCount?: number;
}

export function ChatButton({
  conversationId,
  contextType,
  contextId,
  targetUserId,
  variant = 'icon',
  badgeCount = 0,
}: ChatButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const backgroundColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  const handlePress = () => {
    setModalVisible(true);
  };

  if (variant === 'icon') {
    return (
      <>
        <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
          <IconSymbol name="message.fill" size={24} color="#007AFF" />
          {badgeCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
              <ThemedText style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
        <ChatModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialConversationId={conversationId}
          contextType={contextType}
          contextId={contextId}
          targetUserId={targetUserId}
        />
      </>
    );
  }

  if (variant === 'badge') {
    return (
      <>
        <TouchableOpacity onPress={handlePress} style={styles.badgeButton}>
          <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
          {badgeCount > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
        <ChatModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialConversationId={conversationId}
          contextType={contextType}
          contextId={contextId}
          targetUserId={targetUserId}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={[styles.button, { backgroundColor }]}>
        <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
        <ThemedText style={styles.buttonText}>Discuter</ThemedText>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
      <ChatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialConversationId={conversationId}
        contextType={contextType}
        contextId={contextId}
        targetUserId={targetUserId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    position: 'relative',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  badgeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

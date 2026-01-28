/**
 * Composant principal pour la fenêtre de chat
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MessageBubble } from './MessageBubble';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '../ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { chatService } from '@/services/chat.service';

interface ChatRoomProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatRoom({ conversationId, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const {
    currentConversation,
    messages,
    loading,
    error,
    typingUsers,
    onlineUsers,
    sendMessage,
    markAsRead,
    deleteMessage,
    reportMessage,
    startTyping,
    stopTyping,
  } = useChat({ conversationId, autoLoad: true });

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const backgroundColor = useThemeColor({}, 'background');
  const inputBackgroundColor = useThemeColor(
    { light: '#F5F5F5', dark: '#2C2C2E' },
    'background'
  );
  const borderColor = useThemeColor({ light: '#E5E5EA', dark: '#2C2C2E' }, 'background');

  // Obtenir l'autre participant
  const otherParticipant = currentConversation
    ? currentConversation.participant1.id === user?.id
      ? currentConversation.participant2
      : currentConversation.participant1
    : null;

  // Marquer les messages comme lus quand on ouvre la conversation
  useEffect(() => {
    if (messages.length > 0 && currentConversation) {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user?.id && !msg.readBy.includes(user?.id || '')
      );
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages.map((msg) => msg.id));
      }
    }
  }, [messages, currentConversation, user, markAsRead]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Gérer la frappe
  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.length > 0) {
      startTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } else {
      stopTyping();
    }
  };

  // Envoyer un message
  const handleSend = async () => {
    if (!inputText.trim() && !sending) return;

    const content = inputText.trim();
    setInputText('');
    stopTyping();
    setSending(true);

    try {
      const success = await sendMessage(content, 'fr'); // TODO: Détecter la langue
      if (!success) {
        Alert.alert('Erreur', 'Impossible d\'envoyer le message');
        setInputText(content); // Restaurer le texte
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  // Sélectionner une image
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // TODO: Upload l'image et envoyer le message avec l'URL
        const uploadResult = await chatService.uploadAttachment(result.assets[0], 'image');
        if (uploadResult.success && uploadResult.url) {
          await sendMessage('', 'fr', [uploadResult.url]);
        } else {
          Alert.alert('Erreur', uploadResult.error || 'Impossible d\'uploader l\'image');
        }
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de sélectionner l\'image');
    }
  };

  // Supprimer un message
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      'Supprimer le message',
      'Êtes-vous sûr de vouloir supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMessage(messageId),
        },
      ]
    );
  };

  // Signaler un message
  const handleReportMessage = (messageId: string) => {
    Alert.alert(
      'Signaler le message',
      'Pourquoi signalez-vous ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => reportMessage(messageId, 'SPAM'),
        },
        {
          text: 'Harcèlement',
          onPress: () => reportMessage(messageId, 'HARASSMENT'),
        },
        {
          text: 'Contenu inapproprié',
          onPress: () => reportMessage(messageId, 'INAPPROPRIATE'),
        },
        {
          text: 'Autre',
          onPress: () => reportMessage(messageId, 'OTHER'),
        },
      ]
    );
  };

  if (loading && !currentConversation) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Chargement de la conversation...</ThemedText>
      </ThemedView>
    );
  }

  if (error && !currentConversation) {
    return (
      <ThemedView style={styles.centerContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF3B30" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!currentConversation) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Conversation non trouvée</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.headerName}>
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </ThemedText>
            {onlineUsers.has(otherParticipant?.id || '') ? (
              <ThemedText style={styles.headerStatus}>En ligne</ThemedText>
            ) : typingUsers.has(otherParticipant?.id || '') ? (
              <ThemedText style={styles.headerStatus}>En train d'écrire...</ThemedText>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowTranslation(!showTranslation)}
          style={styles.translationButton}
        >
          <IconSymbol
            name={showTranslation ? 'globe' : 'globe'}
            size={20}
            color={showTranslation ? '#007AFF' : '#999'}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onLongPress={() => {
              if (item.senderId === user?.id) {
                handleDeleteMessage(item.id);
              } else {
                handleReportMessage(item.id);
              }
            }}
            onReport={() => handleReportMessage(item.id)}
            showTranslation={showTranslation}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>Aucun message</ThemedText>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { borderTopColor: borderColor }]}>
        <TouchableOpacity onPress={handlePickImage} style={styles.attachButton}>
          <IconSymbol name="paperclip" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor }]}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Tapez un message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol name="arrow.up.circle.fill" size={32} color={inputText.trim() ? '#007AFF' : '#999'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    color: '#999',
  },
  translationButton: {
    padding: 8,
  },
  messagesContainer: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

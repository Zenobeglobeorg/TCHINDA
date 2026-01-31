/**
 * Composant pour prévisualiser les pièces jointes (images, documents, etc.)
 */

import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Attachment } from '@/services/chat.service';
import { IconSymbol } from '../ui/IconSymbol';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function AttachmentPreview({ attachment, onPress, size = 'medium' }: AttachmentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeStyles = {
    small: { width: 100, height: 100 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 },
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // TODO: Ouvrir la pièce jointe en plein écran
      console.log('Ouvrir pièce jointe:', attachment.url);
    }
  };

  // Afficher une image
  if (attachment.type === 'image' && attachment.url) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.container}>
        <View style={[styles.imageContainer, sizeStyles[size]]}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
            </View>
          )}
          {error ? (
            <View style={styles.errorContainer}>
              <IconSymbol name="photo" size={32} color="#999" />
              <ThemedText style={styles.errorText}>Erreur de chargement</ThemedText>
            </View>
          ) : (
            <Image
              source={{ uri: attachment.url }}
              style={[styles.image, sizeStyles[size]]}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Afficher un document
  if (attachment.type === 'document') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.documentContainer}>
        <View style={styles.documentIcon}>
          <IconSymbol name="doc.fill" size={24} color="#007AFF" />
        </View>
        <View style={styles.documentInfo}>
          <ThemedText style={styles.documentName} numberOfLines={1}>
            {attachment.fileName || 'Document'}
          </ThemedText>
          {attachment.fileSize && (
            <ThemedText style={styles.documentSize}>
              {(attachment.fileSize / 1024).toFixed(1)} KB
            </ThemedText>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color="#999" />
      </TouchableOpacity>
    );
  }

  // Afficher une vidéo
  if (attachment.type === 'video') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.container}>
        <View style={[styles.videoContainer, sizeStyles[size]]}>
          {attachment.thumbnailUrl ? (
            <Image source={{ uri: attachment.thumbnailUrl }} style={[styles.image, sizeStyles[size]]} />
          ) : (
            <View style={styles.videoPlaceholder}>
              <IconSymbol name="play.circle.fill" size={48} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.playButton}>
            <IconSymbol name="play.fill" size={24} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Afficher un audio
  if (attachment.type === 'audio') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.audioContainer}>
        <View style={styles.audioIcon}>
          <IconSymbol name="waveform" size={24} color="#007AFF" />
        </View>
        <View style={styles.audioInfo}>
          <ThemedText style={styles.audioName}>
            {attachment.fileName || 'Audio'}
          </ThemedText>
          {attachment.fileSize && (
            <ThemedText style={styles.audioSize}>
              {(attachment.fileSize / 1024).toFixed(1)} KB
            </ThemedText>
          )}
        </View>
        <IconSymbol name="play.fill" size={20} color="#007AFF" />
      </TouchableOpacity>
    );
  }

  // Type inconnu
  return (
    <View style={styles.unknownContainer}>
      <IconSymbol name="questionmark.circle" size={24} color="#999" />
      <ThemedText style={styles.unknownText}>
        {attachment.fileName || 'Pièce jointe'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  image: {
    borderRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#999',
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  audioIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
  },
  audioInfo: {
    flex: 1,
  },
  audioName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  audioSize: {
    fontSize: 12,
    color: '#999',
  },
  unknownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  unknownText: {
    fontSize: 14,
    color: '#999',
  },
});

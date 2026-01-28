/**
 * Composant de recherche d'utilisateurs pour démarrer une conversation
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '../ui/IconSymbol';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  accountType: string;
  isOnline?: boolean;
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  onClose?: () => void;
}

export function UserSearch({ onUserSelect, onClose }: UserSearchProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBackgroundColor = useThemeColor({}, 'input');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const placeholderColor = useThemeColor({}, 'placeholder');

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chatService.searchUsers(query);
      if (response.success && response.data) {
        // Filtrer l'utilisateur actuel de la liste
        const filteredUsers = response.data.filter((u) => u.id !== currentUser?.id);
        setUsers(filteredUsers);
      } else {
        setError(response.error?.message || 'Erreur lors de la recherche');
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Debounce la recherche
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(text);
    }, 500);
  }, [searchUsers]);

  const handleUserSelect = useCallback(async (selectedUser: User) => {
    try {
      // Créer ou récupérer une conversation avec cet utilisateur
      const response = await chatService.createOrGetConversation({
        participant2Id: selectedUser.id,
        type: 'SUPPORT', // Par défaut, peut être changé selon le contexte
      });

      if (response.success && response.data) {
        if (onUserSelect) {
          onUserSelect(selectedUser);
        }
        // Naviguer vers la conversation
        router.push(`/chat/${response.data.id}`);
        if (onClose) {
          onClose();
        }
      } else {
        setError('Impossible de créer la conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la conversation');
    }
  }, [onUserSelect, onClose, router]);

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: borderColor }]}
      onPress={() => handleUserSelect(item)}
    >
      <View style={styles.userAvatar}>
        {item.photo ? (
          <IconSymbol name="person.circle.fill" size={40} color={tintColor} />
        ) : (
          <IconSymbol name="person.circle.fill" size={40} color={tintColor} />
        )}
        {item.isOnline && (
          <View style={[styles.onlineIndicator, { backgroundColor: '#28A745' }]} />
        )}
      </View>
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>
          {item.firstName} {item.lastName}
        </ThemedText>
        <ThemedText style={[styles.userEmail, { color: placeholderColor }]}>
          {item.email}
        </ThemedText>
        <ThemedText style={[styles.userType, { color: placeholderColor }]}>
          {item.accountType}
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color={placeholderColor} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header avec barre de recherche */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={placeholderColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor, backgroundColor: inputBackgroundColor }]}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setUsers([]);
              }}
              style={styles.clearButton}
            >
              <IconSymbol name="xmark.circle.fill" size={20} color={placeholderColor} />
            </TouchableOpacity>
          )}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des résultats */}
      {loading && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: placeholderColor }]}>
            Recherche en cours...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF3B30" />
          <ThemedText style={[styles.errorText, { color: '#FF3B30' }]}>{error}</ThemedText>
        </View>
      ) : users.length === 0 && searchQuery.length >= 2 ? (
        <View style={styles.centerContainer}>
          <IconSymbol name="person.2" size={64} color={placeholderColor} />
          <ThemedText style={[styles.emptyText, { color: placeholderColor }]}>
            Aucun utilisateur trouvé
          </ThemedText>
        </View>
      ) : searchQuery.length < 2 ? (
        <View style={styles.centerContainer}>
          <IconSymbol name="magnifyingglass" size={64} color={placeholderColor} />
          <ThemedText style={[styles.emptyText, { color: placeholderColor }]}>
            Tapez au moins 2 caractères pour rechercher
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#FFFFFF',
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userType: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
});

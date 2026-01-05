import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

interface Moderator {
  id: string;
  name: string;
  email: string;
  assignedCategories: string[];
  itemsModerated: number;
  itemsApproved: number;
  itemsRejected: number;
  isActive: boolean;
}

export default function ModeratorsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadModerators();
  }, []);

  const loadModerators = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/moderators
      const mockModerators: Moderator[] = [
        {
          id: '1',
          name: 'Modérateur A',
          email: 'moderator1@tchinda.com',
          assignedCategories: ['Électronique', 'Vêtements'],
          itemsModerated: 125,
          itemsApproved: 98,
          itemsRejected: 27,
          isActive: true,
        },
      ];
      setModerators(mockModerators);
    } catch (error) {
      console.error('Error loading moderators:', error);
      alert('Erreur', 'Impossible de charger les modérateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadModerators();
  };

  if (loading && moderators.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Gestion des modérateurs
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Gestion des modérateurs
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Rechercher un modérateur..."
          placeholderTextColor={textColor + '60'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {moderators.map((moderator) => (
          <View key={moderator.id} style={[styles.moderatorCard, { backgroundColor }]}>
            <View style={styles.moderatorInfo}>
              <View style={[styles.avatar, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.avatarText}>{moderator.name[0]}</ThemedText>
              </View>
              <View style={styles.moderatorDetails}>
                <ThemedText style={[styles.moderatorName, { color: textColor }]}>
                  {moderator.name}
                </ThemedText>
                <ThemedText style={[styles.moderatorEmail, { color: textColor + '80' }]}>
                  {moderator.email}
                </ThemedText>
                <View style={styles.statsRow}>
                  <ThemedText style={[styles.statText, { color: textColor + '60' }]}>
                    {moderator.itemsModerated} modérés • {moderator.itemsApproved} approuvés •{' '}
                    {moderator.itemsRejected} rejetés
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 4,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moderatorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moderatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  moderatorDetails: {
    flex: 1,
  },
  moderatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  moderatorEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
  },
});


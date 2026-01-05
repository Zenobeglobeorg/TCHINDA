import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

export default function UsersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadUsers();
  }, [filterType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Pour l'instant, utiliser un endpoint générique - à remplacer par /api/admin/users
      const response = await apiService.get('/api/users');
      if (response.success) {
        let usersData = response.data || [];
        if (filterType) {
          usersData = usersData.filter((user: any) => user.accountType === filterType);
        }
        if (searchQuery) {
          usersData = usersData.filter(
            (user: any) =>
              user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      ADMIN: 'Administrateur',
      MODERATOR: 'Modérateur',
      ACCOUNTANT: 'Factureur',
      DELIVERY: 'Livreur',
      COMMERCIAL: 'Commercial',
    };
    return labels[type] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      BUYER: '#4A90E2',
      SELLER: '#9B59B6',
      ADMIN: '#E74C3C',
      MODERATOR: '#F39C12',
      ACCOUNTANT: '#3498DB',
      DELIVERY: '#2ECC71',
      COMMERCIAL: '#1ABC9C',
    };
    return colors[type] || '#666';
  };

  const handleUserAction = (user: any, action: string) => {
    alert('Action', `${action} pour ${user.email}`);
    // TODO: Implémenter les actions (activer/désactiver, supprimer, etc.)
  };

  const accountTypes = [
    { label: 'Tous', value: null },
    { label: 'Acheteurs', value: 'BUYER' },
    { label: 'Vendeurs', value: 'SELLER' },
    { label: 'Admins', value: 'ADMIN' },
    { label: 'Modérateurs', value: 'MODERATOR' },
  ];

  const renderUser = ({ item }: { item: any }) => (
    <View style={[styles.userCard, { backgroundColor }]}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <ThemedText style={styles.userAvatarText}>
              {item.firstName?.[0] || item.email?.[0] || 'U'}
            </ThemedText>
          </View>
          <View style={styles.userDetails}>
            <ThemedText style={[styles.userName, { color: textColor }]}>
              {item.firstName} {item.lastName}
            </ThemedText>
            <ThemedText style={[styles.userEmail, { color: textColor + '80' }]}>
              {item.email}
            </ThemedText>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getAccountTypeColor(item.accountType) + '20' },
              ]}
            >
              <ThemedText
                style={[styles.typeText, { color: getAccountTypeColor(item.accountType) }]}
              >
                {getAccountTypeLabel(item.accountType)}
              </ThemedText>
            </View>
          </View>
        </View>
        {item.phone && (
          <ThemedText style={[styles.userPhone, { color: textColor + '60' }]}>
            📞 {item.phone}
          </ThemedText>
        )}
        <ThemedText style={[styles.userDate, { color: textColor + '60' }]}>
          Inscrit le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </ThemedText>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
          onPress={() => handleUserAction(item, 'Voir')}
        >
          <IconSymbol name="eye.fill" size={20} color={tintColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3498DB20' }]}
          onPress={() => handleUserAction(item, 'Modifier')}
        >
          <IconSymbol name="pencil" size={20} color="#3498DB" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Gérer les utilisateurs</ThemedText>
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Gérer les utilisateurs
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search and Filters */}
      <View style={[styles.filtersContainer, { backgroundColor }]}>
        <View style={[styles.searchContainer, { backgroundColor: backgroundColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor={textColor + '60'}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              loadUsers();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={textColor + '60'} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterButtons}>
          {accountTypes.map((type) => (
            <TouchableOpacity
              key={type.value || 'all'}
              style={[
                styles.filterButton,
                type.value === filterType && [styles.filterButtonActive, { backgroundColor: tintColor }],
              ]}
              onPress={() => setFilterType(type.value)}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  { color: type.value === filterType ? '#FFF' : textColor },
                ]}
              >
                {type.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucun utilisateur trouvé
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
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#624cacff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});



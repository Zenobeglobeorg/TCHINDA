import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

export default function AdminProductsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadProducts();
  }, [filterStatus]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await apiService.get(`/api/products?${params.toString()}`);
      if (response.success) {
        const productsData = response.data?.products || response.data || [];
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
  };

  const handleProductAction = (product: any, action: string) => {
    alert('Action', `${action} pour ${product.name}`);
    // TODO: Implémenter les actions (modérer, supprimer, etc.)
  };

  const statusFilters = [
    { label: 'Tous', value: null },
    { label: 'Actifs', value: 'active' },
    { label: 'Inactifs', value: 'inactive' },
    { label: 'En attente', value: 'pending' },
  ];

  const renderProduct = ({ item }: { item: any }) => (
    <View style={[styles.productCard, { backgroundColor }]}>
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <ThemedText style={[styles.productName, { color: textColor }]} numberOfLines={2}>
          {item.name}
        </ThemedText>
        <ThemedText style={[styles.productPrice, { color: tintColor }]}>
          {parseFloat(item.price).toLocaleString('fr-FR')} {item.currency || 'XOF'}
        </ThemedText>
        <ThemedText style={[styles.productSeller, { color: textColor + '80' }]}>
          Vendeur: {item.seller?.shopName || 'N/A'}
        </ThemedText>
        <View style={styles.productMeta}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.isActive
                  ? '#28A74520'
                  : item.status === 'pending'
                  ? '#FFC10720'
                  : '#DC354520',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                {
                  color: item.isActive
                    ? '#28A745'
                    : item.status === 'pending'
                    ? '#FFC107'
                    : '#DC3545',
                },
              ]}
            >
              {item.isActive ? 'Actif' : item.status === 'pending' ? 'En attente' : 'Inactif'}
            </ThemedText>
          </View>
          <ThemedText style={[styles.productStock, { color: textColor + '60' }]}>
            Stock: {item.stock || 0}
          </ThemedText>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
          onPress={() => handleProductAction(item, 'Voir')}
        >
          <IconSymbol name="eye.fill" size={20} color={tintColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3498DB20' }]}
          onPress={() => handleProductAction(item, 'Modérer')}
        >
          <IconSymbol name="checkmark.shield.fill" size={20} color="#3498DB" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Gérer les produits</ThemedText>
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
          Gérer les produits
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search and Filters */}
      <View style={[styles.filtersContainer, { backgroundColor }]}>
        <View style={[styles.searchContainer, { backgroundColor: backgroundColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={textColor + '60'}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              loadProducts();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={textColor + '60'} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterButtons}>
          {statusFilters.map((status) => (
            <TouchableOpacity
              key={status.value || 'all'}
              style={[
                styles.filterButton,
                status.value === filterStatus && [styles.filterButtonActive, { backgroundColor: tintColor }],
              ]}
              onPress={() => setFilterStatus(status.value)}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  { color: status.value === filterStatus ? '#FFF' : textColor },
                ]}
              >
                {status.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="cube.box" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucun produit trouvé
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
  productCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productSeller: {
    fontSize: 14,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productStock: {
    fontSize: 12,
  },
  productActions: {
    justifyContent: 'center',
    gap: 8,
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



import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';
import { LoadingView } from '@/components/ui/LoadingView';

type ModerationStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

const STATUS_TABS: { key: ModerationStatus; label: string }[] = [
  { key: 'PENDING', label: 'En attente' },
  { key: 'ACTIVE', label: 'Approuvés' },
  { key: 'INACTIVE', label: 'Rejetés' },
];

const STATUS_LABELS: Record<ModerationStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  INACTIVE: 'Rejeté',
};

const STATUS_COLORS: Record<ModerationStatus, string> = {
  PENDING: '#FFC107',
  ACTIVE: '#28A745',
  INACTIVE: '#DC3545',
};

const getSellerName = (seller: any) =>
  seller?.sellerProfile?.shopName || seller?.fullName || seller?.firstName || 'Vendeur inconnu';

export default function AdminProductsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<ModerationStatus>('PENDING');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSellerId(null); // le vendeur sélectionné n'a plus forcément de produit dans ce sous-ensemble
    loadProducts();
  }, [statusTab, categoryId, searchQuery]);

  const loadCategories = async () => {
    try {
      const res = await apiService.get('/api/admin/categories');
      if (res.success) {
        const data: any = res.data || [];
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch {
      // non bloquant : le filtre catégorie reste juste vide
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', statusTab);
      if (searchQuery) params.append('search', searchQuery);
      if (categoryId) params.append('categoryId', categoryId);

      const response = await apiService.get(`/api/admin/products/pending?${params.toString()}`);
      if (response.success) {
        const data: any = response.data || {};
        setProducts(data.products || []);
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

  // Liste des vendeurs présents dans le sous-ensemble actuel (statut + catégorie + recherche),
  // pour un filtre rapide sans avoir besoin d'un endpoint dédié.
  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.sellerId) map.set(p.sellerId, getSellerName(p.seller));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (!sellerId) return products;
    return products.filter((p) => p.sellerId === sellerId);
  }, [products, sellerId]);

  const applyStatusChange = async (product: any, status: ModerationStatus) => {
    setActioningId(product.id);
    try {
      const res = await apiService.put(`/api/admin/products/${product.id}/status`, { status });
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        alert('Statut mis à jour', `"${product.name}" est maintenant ${STATUS_LABELS[status].toLowerCase()}.`);
      } else {
        alert('Erreur', res.error?.message || 'Impossible de mettre à jour le statut');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Impossible de mettre à jour le statut');
    } finally {
      setActioningId(null);
    }
  };

  const handleApprove = (product: any) => {
    alert(
      'Approuver ce produit',
      `"${product.name}" deviendra visible par les acheteurs.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Approuver', onPress: () => applyStatusChange(product, 'ACTIVE') },
      ]
    );
  };

  const handleReject = (product: any) => {
    alert(
      'Rejeter ce produit',
      `"${product.name}" restera invisible pour les acheteurs.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Rejeter', style: 'destructive', onPress: () => applyStatusChange(product, 'INACTIVE') },
      ]
    );
  };

  const handleChangeStatus = (product: any) => {
    const options = STATUS_TABS
      .filter((t) => t.key !== product.status)
      .map((t) => ({ text: t.label, onPress: () => applyStatusChange(product, t.key) }));

    alert('Changer le statut', `"${product.name}"`, [...options, { text: 'Annuler', style: 'cancel' }]);
  };

  const renderProduct = ({ item }: { item: any }) => {
    const status: ModerationStatus = STATUS_LABELS[item.status as ModerationStatus] ? item.status : 'PENDING';
    return (
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
          <ThemedText style={[styles.productSeller, { color: textColor + '80' }]} numberOfLines={1}>
            Vendeur: {getSellerName(item.seller)}
          </ThemedText>
          {item.category?.name && (
            <ThemedText style={[styles.productSeller, { color: textColor + '60' }]} numberOfLines={1}>
              Catégorie: {item.category.name}
            </ThemedText>
          )}
          <View style={styles.productMeta}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] + '20' }]}>
              <ThemedText style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
                {STATUS_LABELS[status]}
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
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <IconSymbol name="eye.fill" size={20} color={tintColor} />
          </TouchableOpacity>
          {actioningId === item.id ? (
            <View style={styles.actionButton}>
              <ActivityIndicator size="small" color={tintColor} />
            </View>
          ) : status === 'PENDING' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#28A74520' }]}
                onPress={() => handleApprove(item)}
              >
                <IconSymbol name="checkmark.circle.fill" size={20} color="#28A745" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#DC354520' }]}
                onPress={() => handleReject(item)}
              >
                <IconSymbol name="xmark.circle.fill" size={20} color="#DC3545" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#3498DB20' }]}
              onPress={() => handleChangeStatus(item)}
            >
              <IconSymbol name="pencil" size={20} color="#3498DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Modération produits</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <LoadingView message="Chargement des produits..." />
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
          Modération produits
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Status tabs */}
      <View style={[styles.tabsContainer, { backgroundColor }]}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              statusTab === tab.key && [styles.tabActive, { backgroundColor: tintColor }],
            ]}
            onPress={() => setStatusTab(tab.key)}
          >
            <ThemedText style={[styles.tabText, { color: statusTab === tab.key ? '#FFF' : textColor }]}>
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and filters */}
      <View style={[styles.filtersContainer, { backgroundColor }]}>
        <View style={[styles.searchContainer, { backgroundColor: backgroundColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textColor + '60'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={textColor + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={textColor + '60'} />
            </TouchableOpacity>
          )}
        </View>

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !categoryId && [styles.chipActive, { backgroundColor: tintColor }]]}
              onPress={() => setCategoryId(null)}
            >
              <ThemedText style={[styles.chipText, { color: !categoryId ? '#FFF' : textColor }]}>
                Toutes catégories
              </ThemedText>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.chip,
                  categoryId === c.id && [styles.chipActive, { backgroundColor: tintColor }],
                ]}
                onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
              >
                <ThemedText style={[styles.chipText, { color: categoryId === c.id ? '#FFF' : textColor }]}>
                  {c.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {sellerOptions.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !sellerId && [styles.chipActive, { backgroundColor: '#3498DB' }]]}
              onPress={() => setSellerId(null)}
            >
              <ThemedText style={[styles.chipText, { color: !sellerId ? '#FFF' : textColor }]}>
                Tous vendeurs
              </ThemedText>
            </TouchableOpacity>
            {sellerOptions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, sellerId === s.id && [styles.chipActive, { backgroundColor: '#3498DB' }]]}
                onPress={() => setSellerId(sellerId === s.id ? null : s.id)}
              >
                <ThemedText style={[styles.chipText, { color: sellerId === s.id ? '#FFF' : textColor }]}>
                  {s.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ThemedText style={[styles.queueHint, { color: textColor + '80' }]}>
          {visibleProducts.length} produit{visibleProducts.length > 1 ? 's' : ''} — {STATUS_TABS.find((t) => t.key === statusTab)?.label.toLowerCase()}
        </ThemedText>
      </View>

      {/* Products List */}
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="checkmark.shield.fill" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucun produit dans cette catégorie
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  chipActive: {
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  queueHint: {
    fontSize: 13,
    fontStyle: 'italic',
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
    fontSize: 13,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
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

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategoryData();
  }, [id]);

  const loadCategoryData = async () => {
    try {
      const [categoryRes, productsRes] = await Promise.all([
        apiService.get(`/api/categories/${id}`),
        apiService.get(`/api/products?categoryId=${id}`),
      ]);

      if (categoryRes.success) {
        setCategory(categoryRes.data);
      }

      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategoryData();
  };

  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Price filter
    const price = parseFloat(product.price);
    if (priceRange.min && price < parseFloat(priceRange.min)) {
      return false;
    }
    if (priceRange.max && price > parseFloat(priceRange.max)) {
      return false;
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-desc':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'rating':
        return (parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {category?.name || 'Catégorie'}
        </ThemedText>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <IconSymbol name="gearshape.fill" size={24} color="#624cacff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans cette catégorie..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Trier par</ThemedText>
              <View style={styles.filterOptions}>
                {['relevance', 'price-asc', 'price-desc', 'rating', 'newest'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      sortBy === option && styles.filterOptionActive,
                    ]}
                    onPress={() => setSortBy(option)}
                  >
                    <ThemedText
                      style={[
                        styles.filterOptionText,
                        sortBy === option && styles.filterOptionTextActive,
                      ]}
                    >
                      {option === 'relevance' && 'Pertinence'}
                      {option === 'price-asc' && 'Prix croissant'}
                      {option === 'price-desc' && 'Prix décroissant'}
                      {option === 'rating' && 'Note'}
                      {option === 'newest' && 'Plus récent'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Prix</ThemedText>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={priceRange.min}
                  onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
                  keyboardType="numeric"
                />
                <ThemedText style={styles.priceSeparator}>-</ThemedText>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={priceRange.max}
                  onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <ThemedText style={styles.clearFiltersText}>Réinitialiser les filtres</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultsText}>
            {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''} trouvé{sortedProducts.length > 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={64} color="#CCC" />
            <ThemedText style={styles.emptyTitle}>Aucun produit trouvé</ThemedText>
            <ThemedText style={styles.emptyText}>
              Essayez de modifier vos filtres de recherche
            </ThemedText>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {sortedProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                {product.images?.[0] && /^https?:\/\//i.test(product.images[0]) ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <IconSymbol name="photo" size={40} color="#CCC" />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <ThemedText style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </ThemedText>

                  {product.rating && (
                    <View style={styles.rating}>
                      <IconSymbol name="star.fill" size={12} color="#FFD700" />
                      <ThemedText style={styles.ratingText}>
                        {parseFloat(product.rating).toFixed(1)} ({product.reviewCount || 0})
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.productFooter}>
                    <ThemedText style={styles.productPrice}>
                      {parseFloat(product.price).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {product.currency || 'XOF'}
                    </ThemedText>
                    {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                      <ThemedText style={styles.oldPrice}>
                        {parseFloat(product.compareAtPrice).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {product.currency || 'XOF'}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    backgroundColor: '#FFF',
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
    marginHorizontal: 16,
  },
  filterButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersPanel: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionActive: {
    backgroundColor: '#624cacff',
    borderColor: '#624cacff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 16,
    color: '#666',
  },
  clearFiltersButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#624cacff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    minHeight: 40,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#624cacff',
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});



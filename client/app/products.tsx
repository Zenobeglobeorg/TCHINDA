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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');

export default function ProductsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    // Reset page when filters change
    setPage(1);
    loadProducts(true);
  }, [searchQuery, selectedCategory, sortBy, priceRange]);

  const loadCategories = async () => {
    try {
      const response = await apiService.get('/api/categories');
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async (reset = false) => {
    if (reset) {
      setProducts([]);
      setPage(1);
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      params.append('sortBy', sortBy);
      params.append('page', reset ? '1' : page.toString());
      params.append('limit', '20');

      const response = await apiService.get(`/api/products?${params.toString()}`);
      if (response.success) {
        const newProducts = response.data?.products || response.data || [];
        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts([...products, ...newProducts]);
        }
        setHasMore(newProducts.length === 20);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
      loadProducts(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
  };

  const hasActiveFilters = searchQuery || selectedCategory || priceRange.min || priceRange.max || sortBy !== 'relevance';

  if (loading && products.length === 0) {
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
        <ThemedText style={styles.headerTitle}>Tous les produits</ThemedText>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <IconSymbol name="gearshape.fill" size={24} color="#624cacff" />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Filter */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                Tous
              </ThemedText>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Trier par</ThemedText>
              <View style={styles.filterOptions}>
                {[
                  { value: 'relevance', label: 'Pertinence' },
                  { value: 'price-asc', label: 'Prix croissant' },
                  { value: 'price-desc', label: 'Prix décroissant' },
                  { value: 'rating', label: 'Note' },
                  { value: 'newest', label: 'Plus récent' },
                  { value: 'popular', label: 'Plus populaire' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      sortBy === option.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.filterOptionText,
                        sortBy === option.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
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

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <ThemedText style={styles.clearFiltersText}>Réinitialiser les filtres</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultsText}>
            {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Products Grid */}
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={64} color="#CCC" />
            <ThemedText style={styles.emptyTitle}>Aucun produit trouvé</ThemedText>
            <ThemedText style={styles.emptyText}>
              {hasActiveFilters
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Aucun produit disponible pour le moment'}
            </ThemedText>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <ThemedText style={styles.clearFiltersText}>Réinitialiser les filtres</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                {product.images?.[0] ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <IconSymbol name="photo" size={40} color="#CCC" />
                  </View>
                )}

                {/* Discount Badge */}
                {product.compareAtPrice &&
                  parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                    <View style={styles.discountBadge}>
                      <ThemedText style={styles.discountText}>
                        -
                        {Math.round(
                          ((parseFloat(product.compareAtPrice) - parseFloat(product.price)) /
                            parseFloat(product.compareAtPrice)) *
                            100
                        )}
                        %
                      </ThemedText>
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
                    <View style={styles.priceContainer}>
                      <ThemedText style={styles.productPrice}>
                        {parseFloat(product.price).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {product.currency || 'XOF'}
                      </ThemedText>
                      {product.compareAtPrice &&
                        parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                          <ThemedText style={styles.oldPrice}>
                            {parseFloat(product.compareAtPrice).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {product.currency || 'XOF'}
                          </ThemedText>
                        )}
                    </View>

                    {product.stock === 0 && (
                      <View style={styles.outOfStockBadge}>
                        <ThemedText style={styles.outOfStockText}>Rupture</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading More Indicator */}
        {loading && products.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#624cacff" />
            <ThemedText style={styles.loadingMoreText}>Chargement...</ThemedText>
          </View>
        )}

        {/* End of List */}
        {!hasMore && products.length > 0 && (
          <View style={styles.endOfList}>
            <ThemedText style={styles.endOfListText}>Fin de la liste</ThemedText>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC3545',
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
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#624cacff',
    borderColor: '#624cacff',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#FFF',
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
    marginTop: 8,
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
    width: (width - 60) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
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
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
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
    marginTop: 2,
  },
  outOfStockBadge: {
    backgroundColor: '#F8D7DA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#DC3545',
    fontWeight: '600',
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
    marginBottom: 24,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
  endOfList: {
    alignItems: 'center',
    padding: 20,
  },
  endOfListText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});



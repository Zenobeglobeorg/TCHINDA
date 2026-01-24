import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function WishlistScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const response = await apiService.get('/api/buyer/wishlist');
      if (response.success) {
        setWishlist(response.data || []);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWishlist();
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const response = await apiService.delete(`/api/buyer/wishlist/${itemId}`);
      if (response.success) {
        await loadWishlist();
      }
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await apiService.post('/api/buyer/cart/items', {
        productId,
        quantity: 1,
      });
      if (response.success) {
        // Navigate to cart
        router.push('/(tabs)/cart');
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
    }
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Ma Liste de Souhaits</ThemedText>
          {wishlist.length > 0 && (
            <ThemedText style={styles.count}>{wishlist.length} article{wishlist.length > 1 ? 's' : ''}</ThemedText>
          )}
        </View>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="heart" size={64} color="#CCC" />
            <ThemedText style={styles.emptyTitle}>Votre liste de souhaits est vide</ThemedText>
            <ThemedText style={styles.emptyText}>
              Ajoutez des produits que vous aimez à votre liste de souhaits
            </ThemedText>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)')}
            >
              <ThemedText style={styles.shopButtonText}>Découvrir les produits</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {wishlist.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/product/${item.productId}`)}
                >
                  {item.product?.images?.[0] && /^https?:\/\//i.test(item.product.images[0]) ? (
                    <Image
                      source={{ uri: item.product.images[0] }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <IconSymbol name="photo" size={40} color="#CCC" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromWishlist(item.id)}
                >
                  <IconSymbol name="heart.fill" size={20} color="#DC3545" />
                </TouchableOpacity>

                <View style={styles.productInfo}>
                  <TouchableOpacity
                    onPress={() => router.push(`/product/${item.productId}`)}
                  >
                    <ThemedText style={styles.productName} numberOfLines={2}>
                      {item.product?.name || 'Produit'}
                    </ThemedText>
                  </TouchableOpacity>

                  <View style={styles.productFooter}>
                    <ThemedText style={styles.productPrice}>
                      {parseFloat(item.product?.price || 0).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {item.product?.currency || 'XOF'}
                    </ThemedText>

                    {item.product?.rating && (
                      <View style={styles.rating}>
                        <IconSymbol name="star.fill" size={12} color="#FFD700" />
                        <ThemedText style={styles.ratingText}>
                          {parseFloat(item.product.rating).toFixed(1)}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => addToCart(item.productId)}
                  >
                    <IconSymbol name="cart.fill" size={16} color="#FFF" />
                    <ThemedText style={styles.addToCartText}>Ajouter au panier</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 14,
    color: '#666',
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
  shopButton: {
    backgroundColor: '#624cacff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grid: {
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
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#624cacff',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#624cacff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});


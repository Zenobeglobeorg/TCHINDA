import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const [productRes, reviewsRes, wishlistRes] = await Promise.all([
        apiService.get(`/api/products/${id}`),
        apiService.get(`/api/products/${id}/reviews`),
        apiService.get('/api/buyer/wishlist'),
      ]);

      if (productRes.success) {
        setProduct(productRes.data);
        const p: any = productRes.data;
        if (p?.hasVariants && Array.isArray(p?.variants) && p.variants.length > 0) {
          const firstActive = p.variants.find((v: any) => v?.isActive) || p.variants[0];
          setSelectedVariantId((prev) => prev || (firstActive?.id ? String(firstActive.id) : null));
        } else {
          setSelectedVariantId(null);
        }
      }

      if (reviewsRes.success) {
        setReviews(reviewsRes.data || []);
      }

      if (wishlistRes.success) {
        const wishlist = wishlistRes.data || [];
        setIsInWishlist(wishlist.some((item: any) => item.productId === id));
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProduct();
  };

  const addToCart = async (opts?: { silent?: boolean }) => {
    setAddingToCart(true);
    try {
      if (product?.hasVariants) {
        if (!selectedVariantId) {
          Alert.alert('Variante requise', 'Veuillez sélectionner une variante.');
          return false;
        }
      }
      const response = await apiService.post('/api/buyer/cart/items', {
        productId: id,
        quantity,
        ...(product?.hasVariants ? { variantId: selectedVariantId } : {}),
      });

      if (response.success) {
        if (!opts?.silent) {
          Alert.alert('Succès', 'Produit ajouté au panier', [
            {
              text: 'Voir le panier',
              onPress: () => router.push('/(tabs)/cart'),
            },
            { text: 'Continuer', style: 'cancel' },
          ]);
        }
        return true;
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de l\'ajout au panier');
        return false;
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (isInWishlist) {
        // Find wishlist item ID
        const wishlistRes = await apiService.get('/api/buyer/wishlist');
        if (wishlistRes.success) {
          const item = wishlistRes.data.find((item: any) => item.productId === id);
          if (item) {
            await apiService.delete(`/api/buyer/wishlist/${item.id}`);
            setIsInWishlist(false);
          }
        }
      } else {
        await apiService.post('/api/buyer/wishlist', { productId: id });
        setIsInWishlist(true);
        Alert.alert('Succès', 'Ajouté à la liste de souhaits');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const buyNow = async () => {
    if (!user) {
      Alert.alert('Connectez-vous', 'Veuillez vous connecter pour acheter.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/Login') },
      ]);
      return;
    }
    if (user.accountType !== 'BUYER') {
      Alert.alert('Accès refusé', 'Cette action est réservée aux acheteurs.');
      return;
    }
    if (product?.hasVariants && !selectedVariantId) {
      Alert.alert('Variante requise', 'Veuillez sélectionner une variante.');
      return;
    }

    try {
      const params: Record<string, string> = {
        productId: String(id),
        quantity: String(quantity),
      };
      if (selectedVariantId) params.variantId = String(selectedVariantId);

      // Navigation robuste (web + mobile) via params
      router.push({
        pathname: '/buyer/checkout',
        params,
      } as any);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’ouvrir le paiement');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="tray" size={64} color="#CCC" />
          <ThemedText style={styles.errorText}>Produit non trouvé</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const images = (product.images || []).filter((u: any) => typeof u === 'string' && /^https?:\/\//i.test(u));
  const hasDiscount = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((parseFloat(product.compareAtPrice) - parseFloat(product.price)) / parseFloat(product.compareAtPrice)) * 100)
    : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <IconSymbol name="chevron.right" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleWishlist} style={styles.headerButton}>
            <IconSymbol
              name={isInWishlist ? 'heart.fill' : 'heart'}
              size={24}
              color={isInWishlist ? '#DC3545' : '#333'}
            />
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.map((image: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      selectedImageIndex === index && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <ThemedText style={styles.discountText}>-{discountPercent}%</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Product Info */}
        <View style={styles.content}>
          <ThemedText style={styles.productName}>{product.name}</ThemedText>

          {/* Rating */}
          {product.rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.rating}>
                <IconSymbol name="star.fill" size={16} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {parseFloat(product.rating).toFixed(1)} ({product.reviewCount || 0} avis)
                </ThemedText>
              </View>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceContainer}>
            <ThemedText style={styles.price}>
              {parseFloat(product.price).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {product.currency || 'XOF'}
            </ThemedText>
            {hasDiscount && (
              <ThemedText style={styles.oldPrice}>
                {parseFloat(product.compareAtPrice).toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {product.currency || 'XOF'}
              </ThemedText>
            )}
          </View>

          {/* Variants */}
          {product?.hasVariants && Array.isArray(product?.variants) && product.variants.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Variante</ThemedText>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedVariantId || ''}
                  onValueChange={(value) => setSelectedVariantId(value ? String(value) : null)}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionner une variante" value="" />
                  {product.variants
                    .filter((v: any) => v?.isActive)
                    .map((v: any) => (
                      <Picker.Item
                        key={String(v.id)}
                        label={`${v.name}${v.stock === 0 ? ' (Rupture)' : ''}`}
                        value={String(v.id)}
                        enabled={v.stock !== 0}
                      />
                    ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            {product.stock > 0 ? (
              <View style={styles.stockBadge}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#28A745" />
                <ThemedText style={styles.stockText}>
                  En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
                </ThemedText>
              </View>
            ) : (
              <View style={styles.stockBadgeOut}>
                <IconSymbol name="xmark.circle.fill" size={16} color="#DC3545" />
                <ThemedText style={styles.stockTextOut}>Rupture de stock</ThemedText>
              </View>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Description</ThemedText>
              <ThemedText style={styles.description}>{product.description}</ThemedText>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Quantité</ThemedText>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <IconSymbol name="minus" size={20} color="#624cacff" />
              </TouchableOpacity>
              <ThemedText style={styles.quantity}>{quantity}</ThemedText>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
              >
                <IconSymbol name="plus" size={20} color="#624cacff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Avis clients</ThemedText>
                <TouchableOpacity onPress={() => router.push(`/product/${id}/reviews`)}>
                  <ThemedText style={styles.seeAll}>Voir tout</ThemedText>
                </TouchableOpacity>
              </View>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <ThemedText style={styles.reviewAuthor}>
                      {review.user?.firstName || 'Utilisateur'}
                    </ThemedText>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <IconSymbol
                          key={i}
                          name="star.fill"
                          size={12}
                          color={i < review.rating ? '#FFD700' : '#CCC'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.title && (
                    <ThemedText style={styles.reviewTitle}>{review.title}</ThemedText>
                  )}
                  {review.comment && (
                    <ThemedText style={styles.reviewComment}>{review.comment}</ThemedText>
                  )}
                  <ThemedText style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.cartButton]}
          onPress={addToCart}
          disabled={addingToCart || product.stock === 0}
        >
          {addingToCart ? (
            <ActivityIndicator color="#624cacff" />
          ) : (
            <>
              <IconSymbol name="cart.fill" size={20} color="#624cacff" />
              <ThemedText style={styles.cartButtonText}>Ajouter au panier</ThemedText>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.buyButton]}
          onPress={buyNow}
          disabled={product.stock === 0}
        >
          <ThemedText style={styles.buyButtonText}>Acheter maintenant</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 100,
  },
  productImage: {
    width: width,
    height: width,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  ratingContainer: {
    marginBottom: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#624cacff',
  },
  oldPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    marginBottom: 24,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  stockBadgeOut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28A745',
  },
  stockTextOut: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC3545',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  picker: {
    width: '100%',
    height: 52,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#624cacff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  seeAll: {
    fontSize: 14,
    color: '#624cacff',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cartButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#624cacff',
  },
  cartButtonText: {
    color: '#624cacff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: '#624cacff',
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#624cacff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



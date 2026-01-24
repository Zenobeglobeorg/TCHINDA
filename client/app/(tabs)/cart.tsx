import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await apiService.get('/api/buyer/cart');
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setUpdating(itemId);
    try {
      const response = await apiService.put(`/api/buyer/cart/items/${itemId}`, {
        quantity: newQuantity,
      });

      if (response.success) {
        await loadCart();
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous retirer cet article du panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete(`/api/buyer/cart/items/${itemId}`);
              if (response.success) {
                await loadCart();
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const clearCart = async () => {
    Alert.alert(
      'Vider le panier',
      'Voulez-vous supprimer tous les articles du panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete('/api/buyer/cart');
              if (response.success) {
                await loadCart();
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const proceedToCheckout = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      Alert.alert('Panier vide', 'Votre panier est vide');
      return;
    }

    router.push('/buyer/checkout');
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const calculateShipping = () => {
    // Free shipping for premium subscribers
    if (user?.subscriptionType === 'GOLD' || user?.subscriptionType === 'DIAMOND') {
      return 0;
    }
    // Default shipping cost
    return cart?.shippingCost || 0;
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateShipping();
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
          <ThemedText style={styles.title}>Mon Panier</ThemedText>
          {cart?.items && cart.items.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <ThemedText style={styles.clearText}>Vider</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Cart Items */}
        {!cart || !cart.items || cart.items.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="cart" size={64} color="#CCC" />
            <ThemedText style={styles.emptyTitle}>Votre panier est vide</ThemedText>
            <ThemedText style={styles.emptyText}>
              Parcourez nos produits et ajoutez-les à votre panier
            </ThemedText>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)')}
            >
              <ThemedText style={styles.shopButtonText}>Commencer les achats</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cart.items.map((item: any) => (
              <View key={item.id} style={styles.cartItem}>
                <TouchableOpacity
                  onPress={() => router.push(`/product/${item.productId}`)}
                  style={styles.productImageContainer}
                >
                  {item.product?.images?.[0] && /^https?:\/\//i.test(item.product.images[0]) ? (
                    <Image
                      source={{ uri: item.product.images[0] }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <IconSymbol name="photo" size={32} color="#CCC" />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.itemDetails}>
                  <TouchableOpacity
                    onPress={() => router.push(`/product/${item.productId}`)}
                  >
                    <ThemedText style={styles.productName} numberOfLines={2}>
                      {item.product?.name || 'Produit'}
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.productPrice}>
                    {parseFloat(item.price).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {item.currency || 'XOF'}
                  </ThemedText>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id}
                    >
                      <IconSymbol name="minus" size={16} color="#624cacff" />
                    </TouchableOpacity>

                    {updating === item.id ? (
                      <ActivityIndicator size="small" color="#624cacff" />
                    ) : (
                      <ThemedText style={styles.quantity}>{item.quantity}</ThemedText>
                    )}

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                    >
                      <IconSymbol name="plus" size={16} color="#624cacff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.itemActions}>
                  <ThemedText style={styles.itemTotal}>
                    {(parseFloat(item.price) * item.quantity).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {item.currency || 'XOF'}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <IconSymbol name="trash" size={20} color="#DC3545" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Shipping Info */}
            {(user?.subscriptionType === 'GOLD' || user?.subscriptionType === 'DIAMOND') && (
              <View style={styles.shippingBadge}>
                <IconSymbol name="star.fill" size={16} color="#FFD700" />
                <ThemedText style={styles.shippingBadgeText}>
                  Livraison gratuite (Abonnement Premium)
                </ThemedText>
              </View>
            )}

            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Sous-total</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {calculateTotal().toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {cart?.currency || 'XOF'}
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Livraison</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {calculateShipping() === 0 ? (
                    <ThemedText style={styles.freeShipping}>Gratuite</ThemedText>
                  ) : (
                    `${calculateShipping().toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} ${cart?.currency || 'XOF'}`
                  )}
                </ThemedText>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.totalValue}>
                  {calculateGrandTotal().toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {cart?.currency || 'XOF'}
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Checkout Button */}
      {cart?.items && cart.items.length > 0 && (
        <View style={styles.checkoutFooter}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={proceedToCheckout}
          >
            <ThemedText style={styles.checkoutButtonText}>
              Passer la commande ({cart.items.length} article{cart.items.length > 1 ? 's' : ''})
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 100,
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
  clearText: {
    fontSize: 14,
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
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#624cacff',
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#624cacff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  shippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  shippingBadgeText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  freeShipping: {
    color: '#28A745',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#624cacff',
  },
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutButton: {
    backgroundColor: '#624cacff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


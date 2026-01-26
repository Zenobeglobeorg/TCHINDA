import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.accountType !== 'BUYER') {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadOrders();
  }, [user, filter]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user || user.accountType !== 'BUYER') return;
      loadOrders();
    }, [user, filter])
  );

  const loadOrders = async () => {
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const response = await apiService.get(`/api/buyer/orders${params}`);
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: '#FFC107',
      CONFIRMED: '#17A2B8',
      PROCESSING: '#624cacff',
      SHIPPED: '#007BFF',
      DELIVERED: '#28A745',
      CANCELLED: '#DC3545',
      REFUNDED: '#6C757D',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En traitement',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      PENDING: 'clock.fill',
      CONFIRMED: 'checkmark.circle.fill',
      PROCESSING: 'gearshape.fill',
      SHIPPED: 'shippingbox.fill',
      DELIVERED: 'checkmark.circle.fill',
      CANCELLED: 'xmark.circle.fill',
      REFUNDED: 'arrow.counterclockwise.circle.fill',
    };
    return icons[status] || 'circle.fill';
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <IconSymbol name="tray" size={64} color="#CCC" />
          <ThemedText style={styles.emptyTitle}>Connectez-vous</ThemedText>
          <ThemedText style={styles.emptyText}>
            Veuillez vous connecter pour voir vos commandes
          </ThemedText>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/Login')}>
            <ThemedText style={styles.shopButtonText}>Se connecter</ThemedText>
          </TouchableOpacity>
        </View>
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
          <ThemedText style={styles.title}>Mes Commandes</ThemedText>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.filtersContent}
        >
          {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(status)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  filter === status && styles.filterTextActive,
                ]}
              >
                {status === 'ALL' ? 'Toutes' : getStatusLabel(status)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders List */}
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={64} color="#CCC" />
            <ThemedText style={styles.emptyTitle}>Aucune commande</ThemedText>
            <ThemedText style={styles.emptyText}>
              {filter === 'ALL'
                ? 'Vous n\'avez pas encore passé de commande'
                : `Aucune commande avec le statut "${getStatusLabel(filter)}"`}
            </ThemedText>
            {filter !== 'ALL' && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setFilter('ALL')}
              >
                <ThemedText style={styles.clearFilterText}>Voir toutes les commandes</ThemedText>
              </TouchableOpacity>
            )}
            {filter === 'ALL' && (
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/(tabs)')}
              >
                <ThemedText style={styles.shopButtonText}>Commencer les achats</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/buyer/orders/${order.id}`)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <ThemedText style={styles.orderNumber}>
                    Commande #{order.orderNumber}
                  </ThemedText>
                  <ThemedText style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '20' },
                  ]}
                >
                  <IconSymbol
                    name={getStatusIcon(order.status)}
                    size={16}
                    color={getStatusColor(order.status)}
                  />
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {getStatusLabel(order.status)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.items?.slice(0, 3).map((item: any, index: number) => (
                  <View key={item.id || index} style={styles.orderItem}>
                    <ThemedText style={styles.orderItemName} numberOfLines={1}>
                      {(item.productSnapshot?.name || item.product?.name || 'Produit') +
                        ((item.productSnapshot?.variantName || item.variant?.name)
                          ? ` • ${item.productSnapshot?.variantName || item.variant?.name}`
                          : '')}
                    </ThemedText>
                    <ThemedText style={styles.orderItemQuantity}>
                      x{item.quantity}
                    </ThemedText>
                  </View>
                ))}
                {order.items && order.items.length > 3 && (
                  <ThemedText style={styles.moreItems}>
                    +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}
                  </ThemedText>
                )}
              </View>

              <View style={styles.orderFooter}>
                <ThemedText style={styles.orderTotal}>
                  Total: {parseFloat(order.total).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {order.currency || 'XOF'}
                </ThemedText>
                {order.trackingNumber && (
                  <View style={styles.tracking}>
                    <IconSymbol name="location.fill" size={14} color="#624cacff" />
                    <ThemedText style={styles.trackingText}>
                      {order.trackingNumber}
                    </ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filters: {
    marginBottom: 20,
  },
  filtersContent: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#624cacff',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
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
  clearFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearFilterText: {
    color: '#624cacff',
    fontSize: 14,
    fontWeight: '600',
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderItemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  moreItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tracking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    fontSize: 12,
    color: '#624cacff',
    fontWeight: '600',
  },
});


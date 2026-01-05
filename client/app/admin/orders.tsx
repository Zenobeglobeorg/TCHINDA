import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await apiService.get(`/api/orders?${params.toString()}`);
      if (response.success) {
        const ordersData = response.data?.orders || response.data || [];
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En cours',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: '#FFC107',
      CONFIRMED: '#17A2B8',
      PROCESSING: '#3498DB',
      SHIPPED: '#624cacff',
      DELIVERED: '#28A745',
      CANCELLED: '#DC3545',
      REFUNDED: '#6C757D',
    };
    return colors[status] || '#666';
  };

  const statusFilters = [
    { label: 'Toutes', value: null },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Confirmées', value: 'CONFIRMED' },
    { label: 'En cours', value: 'PROCESSING' },
    { label: 'Livrées', value: 'DELIVERED' },
    { label: 'Annulées', value: 'CANCELLED' },
  ];

  const renderOrder = ({ item }: { item: any }) => (
    <View style={[styles.orderCard, { backgroundColor }]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <ThemedText style={[styles.orderId, { color: textColor }]}>
            Commande #{item.orderNumber || item.id.slice(0, 8)}
          </ThemedText>
          <ThemedText style={[styles.orderDate, { color: textColor + '80' }]}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <ThemedText
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderDetailRow}>
          <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
            Client:
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {item.buyer?.firstName} {item.buyer?.lastName}
          </ThemedText>
        </View>
        <View style={styles.orderDetailRow}>
          <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
            Vendeur:
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {item.seller?.shopName || 'N/A'}
          </ThemedText>
        </View>
        <View style={styles.orderDetailRow}>
          <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
            Articles:
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: textColor }]}>
            {item.items?.length || 0} article(s)
          </ThemedText>
        </View>
        <View style={styles.orderDetailRow}>
          <ThemedText style={[styles.detailLabel, { color: textColor + '80' }]}>
            Total:
          </ThemedText>
          <ThemedText style={[styles.totalAmount, { color: tintColor }]}>
            {parseFloat(item.totalAmount || 0).toLocaleString('fr-FR')} {item.currency || 'XOF'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
          onPress={() => alert('Détails', `Commande ${item.id}`)}
        >
          <IconSymbol name="eye.fill" size={20} color={tintColor} />
          <ThemedText style={[styles.actionButtonText, { color: tintColor }]}>
            Détails
          </ThemedText>
        </TouchableOpacity>
        {item.status === 'PENDING' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#28A74520' }]}
            onPress={() => alert('Action', 'Confirmer la commande')}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#28A745" />
            <ThemedText style={[styles.actionButtonText, { color: '#28A745' }]}>
              Confirmer
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && orders.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Commandes</ThemedText>
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
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Commandes</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor }]}>
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

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucune commande trouvée
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
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 16,
    gap: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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



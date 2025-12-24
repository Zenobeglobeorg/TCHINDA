import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { sellerService, OrderFilters } from '@/services/seller.service';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  user: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: {
      id: string;
      name: string;
      images?: string[];
    };
    variant?: {
      id: string;
      name: string;
    };
  }>;
  shippingAddress?: any;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    paymentStatus: '',
    page: 1,
    limit: 20,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getOrders(filters);
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const response = await sellerService.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        trackingNumber || undefined
      );
      if (response.success) {
        Alert.alert('Succès', 'Statut de la commande mis à jour');
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setTrackingNumber('');
        loadOrders();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le statut');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setShowStatusModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'CONFIRMED':
        return '#2196F3';
      case 'PROCESSING':
        return '#9C27B0';
      case 'SHIPPED':
        return '#00BCD4';
      case 'DELIVERED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      case 'REFUNDED':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'PROCESSING':
        return 'En traitement';
      case 'SHIPPED':
        return 'Expédiée';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
      case 'REFUNDED':
        return 'Remboursée';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      case 'REFUNDED':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Payé';
      case 'PENDING':
        return 'En attente';
      case 'FAILED':
        return 'Échoué';
      case 'REFUNDED':
        return 'Remboursé';
      default:
        return status;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header avec filtres */}
      <View style={[styles.header, { backgroundColor, paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 10 }]}>
        <ThemedText type="title">Mes Commandes</ThemedText>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: tintColor }]}
            onPress={() => {
              Alert.alert(
                'Filtrer par statut',
                '',
                [
                  { text: 'Tous', onPress: () => setFilters({ ...filters, status: '' }) },
                  { text: 'En attente', onPress: () => setFilters({ ...filters, status: 'PENDING' }) },
                  { text: 'Confirmées', onPress: () => setFilters({ ...filters, status: 'CONFIRMED' }) },
                  { text: 'Expédiées', onPress: () => setFilters({ ...filters, status: 'SHIPPED' }) },
                  { text: 'Livrées', onPress: () => setFilters({ ...filters, status: 'DELIVERED' }) },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.filterButtonText}>
              {filters.status ? getStatusLabel(filters.status) : 'Statut'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: tintColor }]}
            onPress={() => {
              Alert.alert(
                'Filtrer par paiement',
                '',
                [
                  { text: 'Tous', onPress: () => setFilters({ ...filters, paymentStatus: '' }) },
                  { text: 'Payées', onPress: () => setFilters({ ...filters, paymentStatus: 'PAID' }) },
                  { text: 'En attente', onPress: () => setFilters({ ...filters, paymentStatus: 'PENDING' }) },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.filterButtonText}>
              {filters.paymentStatus ? getPaymentStatusLabel(filters.paymentStatus) : 'Paiement'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des commandes */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.orderCard, { backgroundColor }]}
            onPress={() => openStatusModal(item)}
          >
            <View style={styles.orderHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.orderNumber}>
                  Commande #{item.orderNumber}
                </ThemedText>
                <Text style={[styles.orderDate, { color: textColor }]}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={[styles.orderTotal, { color: tintColor }]}>
                {item.total.toLocaleString()} {item.currency}
              </Text>
            </View>

            <View style={styles.orderCustomer}>
              <Text style={[styles.customerName, { color: textColor }]}>
                {item.user.fullName || `${item.user.firstName} ${item.user.lastName}`}
              </Text>
              {item.user.email && (
                <Text style={[styles.customerEmail, { color: textColor }]}>{item.user.email}</Text>
              )}
            </View>

            <View style={styles.orderItems}>
              {item.items.map((orderItem) => (
                <View key={orderItem.id} style={styles.orderItem}>
                  <Text style={[styles.itemName, { color: textColor }]}>
                    {orderItem.product.name}
                    {orderItem.variant && ` - ${orderItem.variant.name}`}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: textColor }]}>
                    x{orderItem.quantity}
                  </Text>
                  <Text style={[styles.itemPrice, { color: textColor }]}>
                    {orderItem.total.toLocaleString()} {item.currency}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.orderStatusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getPaymentStatusColor(item.paymentStatus) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getPaymentStatusColor(item.paymentStatus) },
                  ]}
                >
                  {getPaymentStatusLabel(item.paymentStatus)}
                </Text>
              </View>
            </View>

            {item.trackingNumber && (
              <View style={styles.trackingInfo}>
                <Text style={[styles.trackingLabel, { color: textColor }]}>
                  Numéro de suivi: {item.trackingNumber}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>Aucune commande trouvée</Text>
          </View>
        }
      />

      {/* Modal de mise à jour du statut */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText type="title" style={styles.modalTitle}>
              Mettre à jour le statut
            </ThemedText>

            {selectedOrder && (
              <>
                <Text style={[styles.modalSubtitle, { color: textColor }]}>
                  Commande #{selectedOrder.orderNumber}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: textColor }]}>Nouveau statut</Text>
                  <View style={styles.statusOptions}>
                    {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          newStatus === status && { backgroundColor: tintColor },
                        ]}
                        onPress={() => setNewStatus(status)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            { color: newStatus === status ? '#FFFFFF' : textColor },
                          ]}
                        >
                          {getStatusLabel(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {(newStatus === 'SHIPPED' || newStatus === 'DELIVERED') && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: textColor }]}>Numéro de suivi</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
                      value={trackingNumber}
                      onChangeText={setTrackingNumber}
                      placeholder="Numéro de suivi"
                    />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#9E9E9E' }]}
                    onPress={() => {
                      setShowStatusModal(false);
                      setSelectedOrder(null);
                      setNewStatus('');
                      setTrackingNumber('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: tintColor }]}
                    onPress={handleUpdateStatus}
                  >
                    <Text style={styles.modalButtonText}>Mettre à jour</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderCustomer: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 12,
  },
  orderItems: {
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemQuantity: {
    fontSize: 14,
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackingInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  trackingLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


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

export default function TransactionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadTransactions(true);
  }, [filterType, filterStatus]);

  const loadTransactions = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const response = await apiService.get(`/api/buyer/wallet/transactions?${params.toString()}`);

      if (response.success) {
        const newTransactions = response.data || [];
        if (reset) {
          setTransactions(newTransactions);
          setOffset(limit);
        } else {
          setTransactions((prev) => [...prev, ...newTransactions]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(newTransactions.length === limit);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    await loadTransactions(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadTransactions(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      XOF: 'CFA',
      XAF: 'CFA',
      EUR: '€',
      USD: '$',
      GBP: '£',
    };
    return symbols[currency] || currency;
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencySymbol(currency)}`;
  };

  const getTransactionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      DEPOSIT: 'arrow.down.circle.fill',
      WITHDRAWAL: 'arrow.up.circle.fill',
      PAYMENT: 'creditcard.fill',
      REFUND: 'arrow.counterclockwise.circle.fill',
      COMMISSION: 'percent',
      TRANSFER: 'arrow.left.arrow.right',
    };
    return icons[type] || 'circle.fill';
  };

  const getTransactionColor = (type: string) => {
    const colors: { [key: string]: string } = {
      DEPOSIT: '#28A745',
      WITHDRAWAL: '#DC3545',
      PAYMENT: '#624cacff',
      REFUND: '#17A2B8',
      COMMISSION: '#FFC107',
      TRANSFER: '#6C757D',
    };
    return colors[type] || '#666';
  };

  const getTransactionLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      DEPOSIT: 'Dépôt',
      WITHDRAWAL: 'Retrait',
      PAYMENT: 'Paiement',
      REFUND: 'Remboursement',
      COMMISSION: 'Commission',
      TRANSFER: 'Transfert',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      COMPLETED: 'Terminé',
      PENDING: 'En attente',
      FAILED: 'Échoué',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      COMPLETED: '#28A745',
      PENDING: '#FFC107',
      FAILED: '#DC3545',
      CANCELLED: '#6C757D',
    };
    return colors[status] || '#666';
  };

  const transactionTypes = [
    { label: 'Tous', value: null },
    { label: 'Dépôts', value: 'DEPOSIT' },
    { label: 'Retraits', value: 'WITHDRAWAL' },
    { label: 'Paiements', value: 'PAYMENT' },
    { label: 'Remboursements', value: 'REFUND' },
    { label: 'Transferts', value: 'TRANSFER' },
  ];

  const statusOptions = [
    { label: 'Tous', value: null },
    { label: 'Terminé', value: 'COMPLETED' },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Échoué', value: 'FAILED' },
  ];

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={[styles.transactionCard, { backgroundColor }]}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: getTransactionColor(item.type) + '20' },
          ]}
        >
          <IconSymbol
            name={getTransactionIcon(item.type)}
            size={24}
            color={getTransactionColor(item.type)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText style={[styles.transactionType, { color: textColor }]}>
            {getTransactionLabel(item.type)}
          </ThemedText>
          {item.description && (
            <ThemedText style={[styles.transactionDescription, { color: textColor + '80' }]}>
              {item.description}
            </ThemedText>
          )}
          <ThemedText style={[styles.transactionDate, { color: textColor + '60' }]}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
          {item.paymentMethod && (
            <ThemedText style={[styles.paymentMethod, { color: textColor + '60' }]}>
              {item.paymentMethod}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <ThemedText
          style={[
            styles.transactionAmount,
            {
              color:
                item.type === 'DEPOSIT' || item.type === 'REFUND'
                  ? '#28A745'
                  : item.type === 'WITHDRAWAL' || item.type === 'PAYMENT'
                  ? '#DC3545'
                  : textColor,
            },
          ]}
        >
          {item.type === 'DEPOSIT' || item.type === 'REFUND' ? '+' : '-'}
          {formatAmount(parseFloat(item.amount), item.currency)}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <ThemedText
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {getStatusLabel(item.status)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderFilterButton = (
    label: string,
    value: string | null,
    currentValue: string | null,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        value === currentValue && [styles.filterButtonActive, { backgroundColor: tintColor }],
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={[
          styles.filterButtonText,
          value === currentValue && styles.filterButtonTextActive,
          { color: value === currentValue ? '#FFF' : textColor },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  if (loading && transactions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Historique des transactions</ThemedText>
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
          Historique des transactions
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor }]}>
        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: textColor }]}>Type</ThemedText>
          <View style={styles.filterButtons}>
            {transactionTypes.map((type) =>
              renderFilterButton(
                type.label,
                type.value,
                filterType,
                () => setFilterType(type.value)
              )
            )}
          </View>
        </View>
        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: textColor }]}>Statut</ThemedText>
          <View style={styles.filterButtons}>
            {statusOptions.map((status) =>
              renderFilterButton(
                status.label,
                status.value,
                filterStatus,
                () => setFilterStatus(status.value)
              )
            )}
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="tray" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucune transaction trouvée
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          hasMore && transactions.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={tintColor} />
            </View>
          ) : null
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
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});



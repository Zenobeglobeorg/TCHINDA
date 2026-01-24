import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function TransactionsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');

  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');

  const transactions = [
    {
      id: '1',
      type: 'Deposit',
      accountNumber: 'ACC001',
      amount: 5000,
      currency: 'FCFA',
      date: '2026-01-15',
      status: 'Completed',
      fee: 10,
    },
    {
      id: '2',
      type: 'Withdrawal',
      accountNumber: 'ACC002',
      amount: 2000,
      currency: 'EUR',
      date: '2026-01-14',
      status: 'Pending',
      fee: 50,
    },
    {
      id: '3',
      type: 'Deposit',
      accountNumber: 'ACC003',
      amount: 10000,
      currency: 'FCFA',
      date: '2026-01-13',
      status: 'Completed',
      fee: 10,
    },
  ];

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type.toLowerCase() === filter);

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={[styles.transactionItem, { borderBottomColor: borderColor }]}>
      <View style={styles.transactionIcon}>
        <IconSymbol
          name={item.type === 'Deposit' ? 'plus.circle.fill' : 'minus'}
          size={32}
          color={item.status === 'Completed' ? successColor : warningColor}
        />
      </View>
      <View style={styles.transactionDetails}>
        <ThemedText style={[styles.transactionType, { color: textColor }]}>
          {item.type === 'Deposit' ? 'Dépôt' : 'Retrait'}
        </ThemedText>
        <ThemedText style={[styles.transactionAccount, { color: textColor, opacity: 0.7 }]}>
          Compte: {item.accountNumber}
        </ThemedText>
        <ThemedText style={[styles.transactionDate, { color: textColor, opacity: 0.6 }]}>
          {item.date}
        </ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText style={[styles.amount, { color: successColor }]}>
          {item.amount} {item.currency}
        </ThemedText>
        <ThemedText style={[styles.fee, { color: textColor, opacity: 0.6 }]}>
          Frais: {item.fee} {item.currency}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'Completed' ? successColor : warningColor,
            },
          ]}
        >
          <ThemedText style={styles.statusText}>
            {item.status === 'Completed' ? 'Terminé' : 'En attente'}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Historique des Transactions
        </ThemedText>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filter === 'all' ? tintColor : cardColor,
              borderColor: filter === 'all' ? tintColor : borderColor,
            },
          ]}
          onPress={() => setFilter('all')}
        >
          <ThemedText
            style={[styles.filterText, { color: filter === 'all' ? '#FFFFFF' : textColor }]}
          >
            Toutes
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filter === 'deposits' ? tintColor : cardColor,
              borderColor: filter === 'deposits' ? tintColor : borderColor,
            },
          ]}
          onPress={() => setFilter('deposits')}
        >
          <ThemedText
            style={[styles.filterText, { color: filter === 'deposits' ? '#FFFFFF' : textColor }]}
          >
            Dépôts
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: filter === 'withdrawals' ? tintColor : cardColor,
              borderColor: filter === 'withdrawals' ? tintColor : borderColor,
            },
          ]}
          onPress={() => setFilter('withdrawals')}
        >
          <ThemedText
            style={[
              styles.filterText,
              { color: filter === 'withdrawals' ? '#FFFFFF' : textColor },
            ]}
          >
            Retraits
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  transactionIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionAccount: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fee: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

interface FinancialTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'REFUND';
  amount: number;
  currency: string;
  userId: string;
  userName: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  description?: string;
}

interface Dispute {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  reason: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  amount: number;
  currency: string;
  createdAt: string;
}

export default function FinanceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'disputes'>('overview');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    pendingTransactions: 0,
    pendingDisputes: 0,
  });

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par les endpoints réels
      // const [statsRes, transactionsRes, disputesRes] = await Promise.all([
      //   apiService.get('/api/admin/finance/stats'),
      //   apiService.get('/api/admin/finance/transactions'),
      //   apiService.get('/api/admin/finance/disputes'),
      // ]);

      // Données mockées
      setStats({
        totalRevenue: 1245000,
        totalCommissions: 124500,
        pendingTransactions: 5,
        pendingDisputes: 3,
      });

      setTransactions([
        {
          id: '1',
          type: 'COMMISSION',
          amount: 12500,
          currency: 'XOF',
          userId: 'u1',
          userName: 'Vendeur A',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          description: 'Commission vente',
        },
      ]);

      setDisputes([
        {
          id: '1',
          orderId: 'o1',
          userId: 'u1',
          userName: 'Acheteur B',
          reason: 'Produit non reçu',
          status: 'PENDING',
          amount: 50000,
          currency: 'XOF',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error loading finance data:', error);
      alert('Erreur', 'Impossible de charger les données financières');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: '#FF9800',
      COMPLETED: '#4CAF50',
      FAILED: '#F44336',
      CANCELLED: '#9E9E9E',
      IN_REVIEW: '#2196F3',
      RESOLVED: '#4CAF50',
      REJECTED: '#F44336',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING: 'En attente',
      COMPLETED: 'Terminé',
      FAILED: 'Échoué',
      CANCELLED: 'Annulé',
      IN_REVIEW: 'En examen',
      RESOLVED: 'Résolu',
      REJECTED: 'Rejeté',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      DEPOSIT: 'Dépôt',
      WITHDRAWAL: 'Retrait',
      COMMISSION: 'Commission',
      REFUND: 'Remboursement',
    };
    return labels[type] || type;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Finance & Litiges
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor }]}>
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: 'chart.bar.fill' },
          { id: 'transactions', label: 'Transactions', icon: 'dollarsign.circle.fill' },
          { id: 'disputes', label: 'Litiges', icon: 'exclamationmark.triangle.fill' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.tabActive, { backgroundColor: tintColor }],
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <IconSymbol
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? '#FFF' : textColor}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab.id ? '#FFF' : textColor },
              ]}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {loading && transactions.length === 0 && disputes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
                    <IconSymbol name="dollarsign.circle.fill" size={24} color="#4CAF50" />
                  </View>
                  <ThemedText style={[styles.statValue, { color: textColor }]}>
                    {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                    Revenus totaux
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#9B59B620' }]}>
                    <IconSymbol name="percent" size={24} color="#9B59B6" />
                  </View>
                  <ThemedText style={[styles.statValue, { color: textColor }]}>
                    {stats.totalCommissions.toLocaleString('fr-FR')} XOF
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                    Commissions
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#FF980020' }]}>
                    <IconSymbol name="clock.fill" size={24} color="#FF9800" />
                  </View>
                  <ThemedText style={[styles.statValue, { color: textColor }]}>
                    {stats.pendingTransactions}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                    Transactions en attente
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#F4433620' }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#F44336" />
                  </View>
                  <ThemedText style={[styles.statValue, { color: textColor }]}>
                    {stats.pendingDisputes}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: textColor + '80' }]}>
                    Litiges en attente
                  </ThemedText>
                </View>
              </View>
            </>
          )}

          {activeTab === 'transactions' && (
            <View style={styles.listContainer}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={[styles.itemCard, { backgroundColor }]}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <ThemedText style={[styles.itemTitle, { color: textColor }]}>
                        {getTypeLabel(transaction.type)}
                      </ThemedText>
                      <ThemedText style={[styles.itemSubtitle, { color: textColor + '80' }]}>
                        {transaction.userName}
                      </ThemedText>
                      {transaction.description && (
                        <ThemedText style={[styles.itemDescription, { color: textColor + '60' }]}>
                          {transaction.description}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.itemAmount}>
                      <ThemedText
                        style={[
                          styles.amountText,
                          {
                            color:
                              transaction.type === 'DEPOSIT' || transaction.type === 'COMMISSION'
                                ? '#4CAF50'
                                : '#F44336',
                          },
                        ]}
                      >
                        {transaction.type === 'DEPOSIT' || transaction.type === 'COMMISSION'
                          ? '+'
                          : '-'}
                        {transaction.amount.toLocaleString('fr-FR')} {transaction.currency}
                      </ThemedText>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(transaction.status) + '20' },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusText,
                            { color: getStatusColor(transaction.status) },
                          ]}
                        >
                          {getStatusLabel(transaction.status)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={[styles.itemDate, { color: textColor + '60' }]}>
                    {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'disputes' && (
            <View style={styles.listContainer}>
              {disputes.map((dispute) => (
                <TouchableOpacity
                  key={dispute.id}
                  style={[styles.itemCard, { backgroundColor }]}
                  onPress={() => alert('Litige', `Détails du litige #${dispute.id}`)}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <ThemedText style={[styles.itemTitle, { color: textColor }]}>
                        Litige #{dispute.id}
                      </ThemedText>
                      <ThemedText style={[styles.itemSubtitle, { color: textColor + '80' }]}>
                        Commande #{dispute.orderId} - {dispute.userName}
                      </ThemedText>
                      <ThemedText style={[styles.itemDescription, { color: textColor + '60' }]}>
                        {dispute.reason}
                      </ThemedText>
                    </View>
                    <View style={styles.itemAmount}>
                      <ThemedText style={[styles.amountText, { color: textColor }]}>
                        {dispute.amount.toLocaleString('fr-FR')} {dispute.currency}
                      </ThemedText>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(dispute.status) + '20' },
                        ]}
                      >
                        <ThemedText
                          style={[styles.statusText, { color: getStatusColor(dispute.status) }]}
                        >
                          {getStatusLabel(dispute.status)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={[styles.itemDate, { color: textColor + '60' }]}>
                    {new Date(dispute.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#624cacff',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  listContainer: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 12,
  },
});


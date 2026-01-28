import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { sellerService, SellerStats } from '@/services/seller.service';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ChatButton } from '@/components/chat/ChatButton';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [isChanging, setIsChanging] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getStats(period);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleSwitchToBuyer = async () => {
    Alert.alert(
      'Revenir en mode acheteur',
      'Voulez-vous revenir en mode acheteur ? Vous pourrez toujours revenir en mode vendeur plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setIsChanging(true);
              const response = await apiService.post('/api/users/revert-to-buyer');

              if (response.success) {
                if (response.data?.token) {
                  await apiService.setToken(response.data.token);
                }
                
                await refreshUser();
                await new Promise(resolve => setTimeout(resolve, 300));
                
                Alert.alert(
                  'Succès',
                  'Vous êtes maintenant en mode acheteur',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(tabs)');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', response.error?.message || 'Une erreur est survenue');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue');
            } finally {
              setIsChanging(false);
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ title, value, subtitle, icon }: any) => (
    <View style={[styles.statCard, { backgroundColor: backgroundColor }]}>
      <Text style={[styles.statTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.statValue, { color: tintColor }]}>{value}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: textColor, opacity: 0.6 }]}>{subtitle}</Text>}
    </View>
  );

  if (loading && !stats) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <ThemedText type="title">Tableau de bord</ThemedText>
            <View style={styles.headerActions}>
              <ChatButton variant="icon" contextType="ORDER" />
              <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: tintColor + '20', borderColor: tintColor }]}
                onPress={handleSwitchToBuyer}
                disabled={isChanging}
              >
                {isChanging ? (
                  <ActivityIndicator size="small" color={tintColor} />
                ) : (
                  <>
                    <IconSymbol name="arrow.left.circle.fill" size={16} color={tintColor} />
                    <Text style={[styles.switchButtonText, { color: tintColor }]}>Mode Acheteur</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.periodSelector}>
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodButton,
                  period === p && { backgroundColor: tintColor },
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: period === p ? '#FFFFFF' : textColor },
                  ]}
                >
                  {p === 'DAILY' ? 'Jour' : p === 'WEEKLY' ? 'Semaine' : 'Mois'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statistiques de ventes */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ventes
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total des ventes"
              value={stats?.sales.totalSales || 0}
              subtitle="Commandes"
            />
            <StatCard
              title="Revenus totaux"
              value={`${(stats?.sales.totalRevenue || 0).toLocaleString()} XOF`}
            />
            <StatCard
              title="Panier moyen"
              value={`${(stats?.sales.averageOrderValue || 0).toLocaleString()} XOF`}
            />
            <StatCard
              title="Produits vendus"
              value={stats?.sales.productsSold || 0}
            />
          </View>
        </View>

        {/* Statistiques de trafic */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Trafic
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              title="Vues"
              value={stats?.traffic.views || 0}
            />
            <StatCard
              title="Visiteurs uniques"
              value={stats?.traffic.uniqueVisitors || 0}
            />
            <StatCard
              title="Pages vues"
              value={stats?.traffic.pageViews || 0}
            />
            <StatCard
              title="Taux de rebond"
              value={`${(stats?.traffic.bounceRate || 0).toFixed(1)}%`}
            />
          </View>
        </View>

        {/* Statistiques marketing */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Marketing
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              title="Dépenses publicitaires"
              value={`${(stats?.marketing.adSpend || 0).toLocaleString()} XOF`}
            />
            <StatCard
              title="Impressions"
              value={stats?.marketing.adImpressions || 0}
            />
            <StatCard
              title="Clics"
              value={stats?.marketing.adClicks || 0}
            />
            <StatCard
              title="ROI"
              value={`${(stats?.marketing.roi || 0).toFixed(1)}%`}
              subtitle="Return on Investment"
            />
          </View>
        </View>

        {/* Produits les plus vendus */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Produits les plus vendus
            </ThemedText>
            {stats.topProducts.map((product, index) => (
              <View key={product.id} style={[styles.productItem, { backgroundColor }]}>
                <Text style={[styles.productRank, { color: tintColor }]}>#{index + 1}</Text>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: textColor }]}>{product.name}</Text>
                  <Text style={[styles.productStats, { color: textColor, opacity: 0.6 }]}>
                    {product.soldCount} vendus
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions rapides
          </ThemedText>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: tintColor }]}
              onPress={() => router.push('/seller/products?action=create')}
            >
              <Text style={styles.actionButtonText}>Ajouter un produit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: tintColor }]}
              onPress={() => router.push('/seller/marketing')}
            >
              <Text style={styles.actionButtonText}>Créer une promotion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Option pour devenir client */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Compte
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Vous pouvez revenir en mode client (acheteur) à tout moment pour effectuer des achats.
          </ThemedText>
          <TouchableOpacity
            style={[styles.switchToBuyerButton, { backgroundColor: '#2196F3' }]}
            onPress={handleSwitchToBuyer}
            disabled={isChanging}
          >
            {isChanging ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                <Text style={styles.switchToBuyerButtonText}>Devenir un client</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 10,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 5,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 10,
    marginTop: 5,
  },
  productItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  productRank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 15,
    width: 30,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  productStats: {
    fontSize: 12,
  },
  quickActions: {
    gap: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
    lineHeight: 20,
  },
  switchToBuyerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
    marginTop: 10,
  },
  switchToBuyerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

// Main Dashboard Content
const DashboardContent = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');

  const [balance] = useState(15000);
  const [transactions] = useState([
    { id: '1', type: 'Deposit', amount: 5000, currency: 'FCFA', date: '2026-01-15', status: 'Completed' },
    { id: '2', type: 'Withdrawal', amount: 2000, currency: 'EUR', date: '2026-01-14', status: 'Pending' },
  ]);

  const router = useRouter();
  const handleDeposit = () => router.push('/commercial/deposits');
  const handleWithdrawal = () => router.push('/commercial/withdrawals');

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={[styles.transactionItem, { borderBottomColor: borderColor }]}>
      <IconSymbol
        name={item.type === 'Deposit' ? 'plus.circle.fill' : 'minus'}
        size={24}
        color={item.status === 'Completed' ? successColor : warningColor}
      />
      <View style={styles.transactionDetails}>
        <ThemedText style={[styles.transactionType, { color: textColor }]}>{item.type}</ThemedText>
        <ThemedText style={[styles.transactionDate, { color: textColor, opacity: 0.6 }]}>
          {item.date}
        </ThemedText>
      </View>
      <ThemedText style={[styles.transactionAmount, { color: successColor }]}>
        {item.amount} {item.currency}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.contentContainer, { backgroundColor }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          padding: isWeb ? 20 : 10,
          alignItems: isWeb ? 'stretch' : 'center',
          minHeight: height - 100,
        }}
      >
        {/* Balance Card */}
        <ThemedView style={[styles.card, { width: isWeb ? width * 0.8 : '100%', backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Solde Actuel (Multi-Devises)
          </ThemedText>
          <ThemedText type="title" style={[styles.balanceAmount, { color: successColor }]}>
            {balance} FCFA
          </ThemedText>
          <ThemedText style={[styles.balanceSubtitle, { color: textColor, opacity: 0.6 }]}>
            (Équivalent: ≈25 EUR | Mettre à jour les taux)
          </ThemedText>
        </ThemedView>

        {/* Action Cards */}
        <View style={[styles.actionRow, { flexDirection: isWeb ? 'row' : 'column' }]}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              {
                backgroundColor: '#FF69B4',
                width: isWeb ? '45%' : '100%',
                marginBottom: isWeb ? 0 : 10,
              },
            ]}
            onPress={handleDeposit}
          >
            <IconSymbol name="plus.circle.fill" size={40} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>Nouveau Dépôt</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FF69B4', width: isWeb ? '45%' : '100%' }]}
            onPress={handleWithdrawal}
          >
            <IconSymbol name="minus" size={40} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>Nouveau Retrait</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Revenues Dashboard */}
        <ThemedView style={[styles.card, { width: isWeb ? width * 0.8 : '100%', backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Revenus & Commissions
          </ThemedText>
          <View style={[styles.revenueStats, { flexDirection: isWeb ? 'row' : 'column' }]}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
                Commissions du Jour
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: '#FF69B4' }]}>250 FCFA</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
                Bonus Mensuel
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: '#FF69B4' }]}>1500 FCFA</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
                Volume de Transactions
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: '#FF69B4' }]}>45</ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/commercial/reports')}
          >
            <ThemedText style={styles.reportText}>Générer le Rapport Mensuel</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Transaction History */}
        <ThemedView style={[styles.card, { width: isWeb ? width * 0.8 : '100%', backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Historique des Transactions
          </ThemedText>
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.transactionList}
          />
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => router.push('/commercial/transactions')}
          >
            <ThemedText style={[styles.viewMoreText, { color: tintColor }]}>
              Voir Toutes les Transactions
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Support Section */}
        <ThemedView style={[styles.card, { width: isWeb ? width * 0.8 : '100%', backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Support & Outils
          </ThemedText>
          <TouchableOpacity
            style={[styles.supportButton, { borderBottomColor: borderColor }]}
            onPress={() => router.push('/commercial/support')}
          >
            <IconSymbol name="info.circle.fill" size={24} color={tintColor} />
            <ThemedText style={[styles.supportText, { color: textColor, marginLeft: 10 }]}>
              Support Chat en Direct
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.supportButton, { borderBottomColor: borderColor }]}
            onPress={() => router.push('/commercial/support')}
          >
            <IconSymbol name="iphone" size={24} color={tintColor} />
            <ThemedText style={[styles.supportText, { color: textColor, marginLeft: 10 }]}>
              Assistance Téléphonique
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.supportButton, { borderBottomColor: borderColor }]}
            onPress={() => router.push('/commercial/support')}
          >
            <IconSymbol name="doc.text.fill" size={24} color={tintColor} />
            <ThemedText style={[styles.supportText, { color: textColor, marginLeft: 10 }]}>
              Tickets par Email
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.supportButton, { borderBottomColor: borderColor }]}
            onPress={() => router.push('/commercial/settings')}
          >
            <IconSymbol name="checkmark.shield.fill" size={24} color={tintColor} />
            <ThemedText style={[styles.supportText, { color: textColor, marginLeft: 10 }]}>
              Paramètres de Sécurité (2FA)
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
};

// Main Component
export default function CommercialDashboard() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header avec navigation */}
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Tableau de Bord Commercial
        </ThemedText>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => Alert.alert('Notifications', 'Notifications à venir')}
        >
          <IconSymbol name="bell.badge.fill" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <DashboardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      position: 'sticky',
      top: 0,
    }),
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationIcon: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceSubtitle: {
    fontSize: 14,
  },
  actionRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  actionCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  revenueStats: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'flex-start',
    marginBottom: 10,
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  reportText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  transactionList: {
    maxHeight: 300,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 10,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewMoreButton: {
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  },
  viewMoreText: {
    fontWeight: 'bold',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  supportText: {
    fontSize: 16,
  },
});

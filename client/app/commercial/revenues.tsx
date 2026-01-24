import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function RevenuesScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const stats = {
    daily: { commissions: 250, bonus: 0, volume: 45 },
    weekly: { commissions: 1750, bonus: 500, volume: 315 },
    monthly: { commissions: 7500, bonus: 1500, volume: 1350 },
  };

  const currentStats = stats[period];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Revenus & Commissions
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: isWeb ? 20 : 15 }}
      >
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              {
                backgroundColor: period === 'daily' ? tintColor : cardColor,
                borderColor: period === 'daily' ? tintColor : borderColor,
              },
            ]}
            onPress={() => setPeriod('daily')}
          >
            <ThemedText
              style={[styles.periodText, { color: period === 'daily' ? '#FFFFFF' : textColor }]}
            >
              Journalier
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              {
                backgroundColor: period === 'weekly' ? tintColor : cardColor,
                borderColor: period === 'weekly' ? tintColor : borderColor,
              },
            ]}
            onPress={() => setPeriod('weekly')}
          >
            <ThemedText
              style={[styles.periodText, { color: period === 'weekly' ? '#FFFFFF' : textColor }]}
            >
              Hebdomadaire
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              {
                backgroundColor: period === 'monthly' ? tintColor : cardColor,
                borderColor: period === 'monthly' ? tintColor : borderColor,
              },
            ]}
            onPress={() => setPeriod('monthly')}
          >
            <ThemedText
              style={[styles.periodText, { color: period === 'monthly' ? '#FFFFFF' : textColor }]}
            >
              Mensuel
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Résumé des Revenus
          </ThemedText>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: useThemeColor({}, 'section') }]}>
              <IconSymbol name="dollarsign.circle.fill" size={32} color={tintColor} />
              <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
                Commissions
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: successColor }]}>
                {currentStats.commissions} FCFA
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: useThemeColor({}, 'section') }]}>
              <IconSymbol name="star.fill" size={32} color={tintColor} />
              <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
                Bonus
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>
                {currentStats.bonus} FCFA
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: useThemeColor({}, 'section') }]}>
              <IconSymbol name="chart.bar.fill" size={32} color={tintColor} />
              <ThemedText style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
                Volume
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: tintColor }]}>
                {currentStats.volume} transactions
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Détails des Commissions
          </ThemedText>

          <View style={styles.commissionDetail}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Dépôts (10 FCFA par transaction)
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: successColor }]}>
              {currentStats.volume * 0.6 * 10} FCFA
            </ThemedText>
          </View>

          <View style={styles.commissionDetail}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Retraits (25% des frais)
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: successColor }]}>
              {currentStats.volume * 0.4 * 50} FCFA
            </ThemedText>
          </View>

          <View style={[styles.totalCard, { backgroundColor: tintColor }]}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>
              {currentStats.commissions + currentStats.bonus} FCFA
            </ThemedText>
          </View>
        </ThemedView>

        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: tintColor }]}
          onPress={() => router.push('/commercial/reports')}
        >
          <IconSymbol name="doc.text.fill" size={24} color="#FFFFFF" />
          <ThemedText style={styles.reportButtonText}>Générer le Rapport Détaillé</ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  commissionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

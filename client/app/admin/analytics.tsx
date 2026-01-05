import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const analyticsMetrics = [
    { id: 1, label: 'Vues totales', value: '125,450', change: '+12%', icon: 'eye.fill', color: '#4A90E2' },
    { id: 2, label: 'Commandes', value: '3,245', change: '+8%', icon: 'cart.fill', color: '#9B59B6' },
    { id: 3, label: 'Revenus', value: '45,678,000', change: '+15%', icon: 'dollarsign.circle.fill', color: '#4CAF50' },
    { id: 4, label: 'Taux de conversion', value: '2.58%', change: '+0.3%', icon: 'chart.line.uptrend.xyaxis', color: '#F39C12' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Analytics</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.periodSelector, { backgroundColor }]}>
        {(['day', 'week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && [styles.periodButtonActive, { backgroundColor: tintColor }],
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                { color: selectedPeriod === period ? '#FFF' : textColor },
              ]}
            >
              {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
      >
        <View style={styles.metricsGrid}>
          {analyticsMetrics.map((metric) => (
            <View key={metric.id} style={[styles.metricCard, { backgroundColor }]}>
              <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                <IconSymbol name={metric.icon as any} size={24} color={metric.color} />
              </View>
              <ThemedText style={[styles.metricValue, { color: textColor }]}>
                {metric.value}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: textColor + '80' }]}>
                {metric.label}
              </ThemedText>
              <ThemedText style={[styles.metricChange, { color: '#4CAF50' }]}>
                {metric.change}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: tintColor + '20' }]}>
          <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            Les données analytics sont mises à jour en temps réel toutes les 5 minutes.
          </ThemedText>
        </View>
      </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  periodButtonActive: {
    backgroundColor: '#624cacff',
  },
  periodButtonText: {
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});


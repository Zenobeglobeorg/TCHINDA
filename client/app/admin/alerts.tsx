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

interface SystemAlert {
  id: string;
  type: 'ERROR' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function AlertsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'ERROR' | 'WARNING' | 'INFO' | 'SUCCESS'>('all');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'ERROR',
          title: 'Erreur de paiement',
          message: 'Échec du traitement d\'un paiement de 50,000 XOF',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        {
          id: '2',
          type: 'WARNING',
          title: 'Litige en attente',
          message: '3 litiges nécessitent une attention immédiate',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
        },
        {
          id: '3',
          type: 'INFO',
          title: 'Sauvegarde réussie',
          message: 'La sauvegarde automatique a été effectuée avec succès',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: true,
        },
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
  };

  const getAlertColor = (type: string) => {
    const colors: { [key: string]: string } = {
      ERROR: '#F44336',
      WARNING: '#FF9800',
      INFO: '#2196F3',
      SUCCESS: '#4CAF50',
    };
    return colors[type] || '#666';
  };

  const getAlertIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      ERROR: 'exclamationmark.triangle.fill',
      WARNING: 'exclamationmark.circle.fill',
      INFO: 'info.circle.fill',
      SUCCESS: 'checkmark.circle.fill',
    };
    return icons[type] || 'info.circle.fill';
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter((a) => a.type === filter);

  if (loading && alerts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Alertes système
          </ThemedText>
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
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Alertes système</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.filtersContainer, { backgroundColor }]}>
        {(['all', 'ERROR', 'WARNING', 'INFO', 'SUCCESS'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && [styles.filterButtonActive, { backgroundColor: tintColor }],
            ]}
            onPress={() => setFilter(filterType)}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                { color: filter === filterType ? '#FFF' : textColor },
              ]}
            >
              {filterType === 'all' ? 'Tous' : filterType}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredAlerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              { backgroundColor },
              !alert.isRead && { borderLeftWidth: 4, borderLeftColor: getAlertColor(alert.type) },
            ]}
          >
            <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
              <IconSymbol name={getAlertIcon(alert.type) as any} size={24} color={getAlertColor(alert.type)} />
            </View>
            <View style={styles.alertContent}>
              <ThemedText style={[styles.alertTitle, { color: textColor }]}>
                {alert.title}
              </ThemedText>
              <ThemedText style={[styles.alertMessage, { color: textColor + '80' }]}>
                {alert.message}
              </ThemedText>
              <ThemedText style={[styles.alertTime, { color: textColor + '60' }]}>
                {new Date(alert.timestamp).toLocaleString('fr-FR')}
              </ThemedText>
            </View>
          </View>
        ))}

        {filteredAlerts.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="bell.slash" size={64} color={textColor + '40'} />
            <ThemedText style={[styles.emptyText, { color: textColor + '60' }]}>
              Aucune alerte
            </ThemedText>
          </View>
        )}
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
  filtersContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#624cacff',
  },
  filterButtonText: {
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
  alertCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
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
});


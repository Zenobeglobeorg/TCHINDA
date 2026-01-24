import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || width > 768;

export default function ReportsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>(
    'monthly'
  );

  const reportTypes = [
    {
      id: 'revenue',
      title: 'Rapport des Revenus',
      description: 'Détails des commissions et bonus',
      icon: 'dollarsign.circle.fill',
    },
    {
      id: 'transactions',
      title: 'Rapport des Transactions',
      description: 'Historique complet des opérations',
      icon: 'arrow.left.arrow.right',
    },
    {
      id: 'performance',
      title: 'Rapport de Performance',
      description: 'Statistiques et analytics',
      icon: 'chart.bar.fill',
    },
    {
      id: 'compliance',
      title: 'Rapport de Conformité',
      description: 'Audit et conformité réglementaire',
      icon: 'checkmark.shield.fill',
    },
  ];

  const handleGenerateReport = (reportId: string) => {
    Alert.alert(
      'Génération du Rapport',
      `Génération du rapport ${reportTypes.find((r) => r.id === reportId)?.title} en cours...`,
      [{ text: 'OK' }]
    );
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    Alert.alert('Export', `Export en ${format.toUpperCase()} en cours...`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: tintColor }]}>
        <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Rapports & Analytics
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
                backgroundColor: selectedPeriod === 'monthly' ? tintColor : cardColor,
                borderColor: selectedPeriod === 'monthly' ? tintColor : borderColor,
              },
            ]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <ThemedText
              style={[
                styles.periodText,
                { color: selectedPeriod === 'monthly' ? '#FFFFFF' : textColor },
              ]}
            >
              Mensuel
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === 'quarterly' ? tintColor : cardColor,
                borderColor: selectedPeriod === 'quarterly' ? tintColor : borderColor,
              },
            ]}
            onPress={() => setSelectedPeriod('quarterly')}
          >
            <ThemedText
              style={[
                styles.periodText,
                { color: selectedPeriod === 'quarterly' ? '#FFFFFF' : textColor },
              ]}
            >
              Trimestriel
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === 'yearly' ? tintColor : cardColor,
                borderColor: selectedPeriod === 'yearly' ? tintColor : borderColor,
              },
            ]}
            onPress={() => setSelectedPeriod('yearly')}
          >
            <ThemedText
              style={[
                styles.periodText,
                { color: selectedPeriod === 'yearly' ? '#FFFFFF' : textColor },
              ]}
            >
              Annuel
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Types de Rapports
          </ThemedText>

          {reportTypes.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportItem, { borderBottomColor: borderColor }]}
              onPress={() => handleGenerateReport(report.id)}
            >
              <IconSymbol name={report.icon as any} size={32} color={tintColor} />
              <View style={styles.reportContent}>
                <ThemedText style={[styles.reportTitle, { color: textColor }]}>
                  {report.title}
                </ThemedText>
                <ThemedText style={[styles.reportDescription, { color: textColor, opacity: 0.7 }]}>
                  {report.description}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={textColor} />
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Export des Données
          </ThemedText>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: tintColor }]}
              onPress={() => handleExport('pdf')}
            >
              <IconSymbol name="doc.text.fill" size={24} color="#FFFFFF" />
              <ThemedText style={styles.exportButtonText}>PDF</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: tintColor }]}
              onPress={() => handleExport('excel')}
            >
              <IconSymbol name="doc.text.fill" size={24} color="#FFFFFF" />
              <ThemedText style={styles.exportButtonText}>Excel</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.cardTitle, { color: tintColor }]}>
            Analytics Disponibles
          </ThemedText>
          <ThemedText style={[styles.analyticsText, { color: textColor }]}>
            • Volume de transactions par période{'\n'}
            • Revenus par pays/région{'\n'}
            • Analytics prédictifs{'\n'}
            • Tendances et patterns{'\n'}
            • Comparaisons périodiques
          </ThemedText>
        </ThemedView>
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
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  reportContent: {
    flex: 1,
    marginLeft: 15,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyticsText: {
    fontSize: 14,
    lineHeight: 24,
  },
});

import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

export default function ReportsScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    {
      id: 1,
      title: 'Rapport financier',
      description: 'Revenus, commissions et transactions en temps réel',
      icon: 'dollarsign.circle.fill',
      color: '#3498DB',
    },
    {
      id: 2,
      title: 'Rapport multi-pays',
      description: 'Statistiques par pays et performance globale',
      icon: 'globe',
      color: '#4A90E2',
    },
    {
      id: 3,
      title: 'Rapport des litiges',
      description: 'Analyse des litiges et résolutions',
      icon: 'exclamationmark.triangle.fill',
      color: '#E74C3C',
    },
    {
      id: 4,
      title: 'Rapport analytics',
      description: 'Métriques de performance et conversion',
      icon: 'chart.line.uptrend.xyaxis',
      color: '#28A745',
    },
    {
      id: 5,
      title: 'Rapport publicitaire',
      description: 'Performance des campagnes publicitaires',
      icon: 'megaphone.fill',
      color: '#9B59B6',
    },
    {
      id: 6,
      title: 'Rapport système',
      description: 'Alertes, maintenance et santé du système',
      icon: 'chart.bar.fill',
      color: '#F39C12',
    },
  ];

  const handleGenerateReport = async (report: any) => {
    setGenerating(true);
    // TODO: Implémenter la génération de rapport en temps réel
    setTimeout(() => {
      alert('Rapport', `Rapport "${report.title}" généré avec succès`);
      setGenerating(false);
    }, 2000);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Rapports</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          Générer un rapport
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: textColor + '80' }]}>
          Sélectionnez le type de rapport que vous souhaitez générer
        </ThemedText>

        <View style={styles.reportsGrid}>
          {reportTypes.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportCard, { backgroundColor }]}
              onPress={() => handleGenerateReport(report)}
            >
              <View style={[styles.reportIconContainer, { backgroundColor: report.color + '20' }]}>
                <IconSymbol name={report.icon as any} size={32} color={report.color} />
              </View>
              <ThemedText style={[styles.reportTitle, { color: textColor }]}>
                {report.title}
              </ThemedText>
              <ThemedText style={[styles.reportDescription, { color: textColor + '80' }]}>
                {report.description}
              </ThemedText>
              <View style={styles.reportAction}>
                {generating ? (
                  <ActivityIndicator size="small" color={report.color} />
                ) : (
                  <ThemedText style={[styles.reportActionText, { color: report.color }]}>
                    Générer →
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: tintColor + '20' }]}>
          <IconSymbol name="info.circle.fill" size={24} color={tintColor} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            Les rapports sont générés en temps réel au format PDF et peuvent être téléchargés ou envoyés par email.
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  reportsGrid: {
    gap: 16,
  },
  reportCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  reportAction: {
    alignSelf: 'flex-start',
  },
  reportActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});



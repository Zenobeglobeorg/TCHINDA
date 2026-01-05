import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/utils/alert';

interface Backup {
  id: string;
  name: string;
  type: 'AUTOMATIC' | 'MANUAL';
  size: string;
  createdAt: string;
}

export default function MaintenanceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'endpoint réel /api/admin/maintenance/backups
      const mockBackups: Backup[] = [
        {
          id: '1',
          name: 'Sauvegarde automatique',
          type: 'AUTOMATIC',
          size: '2.5 GB',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Sauvegarde manuelle',
          type: 'MANUAL',
          size: '2.3 GB',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setBackups(mockBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBackups();
  };

  const handleCreateBackup = async () => {
    alert('Info', 'Création d\'une sauvegarde manuelle...');
    // TODO: Implémenter l'appel API
  };

  const handleToggleMaintenance = async () => {
    alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir ${maintenanceMode ? 'désactiver' : 'activer'} le mode maintenance ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            setMaintenanceMode(!maintenanceMode);
            alert('Succès', `Mode maintenance ${!maintenanceMode ? 'activé' : 'désactivé'}`);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.right" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Maintenance & Sauvegardes
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Maintenance Mode */}
        <View style={[styles.sectionCard, { backgroundColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FF980020' }]}>
              <IconSymbol name="wrench.and.screwdriver.fill" size={24} color="#FF9800" />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Mode maintenance
              </ThemedText>
              <ThemedText style={[styles.sectionDescription, { color: textColor + '80' }]}>
                Activez le mode maintenance pour effectuer des mises à jour sans interruption
              </ThemedText>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={handleToggleMaintenance}
              trackColor={{ false: '#E0E0E0', true: tintColor + '80' }}
              thumbColor={maintenanceMode ? tintColor : '#F4F3F4'}
            />
          </View>
        </View>

        {/* Backups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Sauvegardes
            </ThemedText>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: tintColor }]}
              onPress={handleCreateBackup}
            >
              <IconSymbol name="plus" size={16} color="#FFF" />
              <ThemedText style={styles.createButtonText}>Créer</ThemedText>
            </TouchableOpacity>
          </View>

          {backups.map((backup) => (
            <View key={backup.id} style={[styles.backupCard, { backgroundColor }]}>
              <View style={[styles.backupIcon, { backgroundColor: tintColor + '20' }]}>
                <IconSymbol name="externaldrive.fill" size={24} color={tintColor} />
              </View>
              <View style={styles.backupInfo}>
                <ThemedText style={[styles.backupName, { color: textColor }]}>
                  {backup.name}
                </ThemedText>
                <ThemedText style={[styles.backupMeta, { color: textColor + '80' }]}>
                  {backup.type === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'} • {backup.size} •{' '}
                  {new Date(backup.createdAt).toLocaleDateString('fr-FR')}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: tintColor + '20' }]}
                onPress={() => alert('Info', 'Téléchargement de la sauvegarde...')}
              >
                <IconSymbol name="arrow.down.circle.fill" size={20} color={tintColor} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* System Info */}
        <View style={[styles.infoCard, { backgroundColor: tintColor + '20' }]}>
          <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            Les sauvegardes automatiques sont effectuées quotidiennement à 2h du matin.
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
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  backupMeta: {
    fontSize: 12,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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


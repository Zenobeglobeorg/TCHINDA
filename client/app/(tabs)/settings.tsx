import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/constants/config';

export default function SettingsScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangeAccountType = async (newType: 'SELLER' | 'BUYER') => {
    if (!user) return;

    const currentType = user.accountType;
    
    // Si on essaie de changer vers le même type
    if (currentType === newType) {
      Alert.alert('Information', `Vous êtes déjà ${newType === 'SELLER' ? 'vendeur' : 'acheteur'}`);
      return;
    }

    // Confirmation
    const action = newType === 'SELLER' ? 'devenir vendeur' : 'revenir à acheteur';
    Alert.alert(
      'Changer le type de compte',
      `Êtes-vous sûr de vouloir ${action} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setIsChanging(true);
            try {
              let response;
              
              if (newType === 'SELLER') {
                // Changer vers SELLER
                response = await apiService.put('/api/users/account-type', {
                  newAccountType: 'SELLER',
                });
              } else {
                // Revenir à BUYER
                response = await apiService.post('/api/users/revert-to-buyer');
              }

              if (response.success) {
                // Mettre à jour le token si fourni
                if (response.data?.token) {
                  await apiService.setToken(response.data.token);
                }
                
                // Rafraîchir les données utilisateur
                await refreshUser();
                
                Alert.alert(
                  'Succès',
                  response.message || `Vous êtes maintenant ${newType === 'SELLER' ? 'vendeur' : 'acheteur'}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Erreur', response.error?.message || 'Une erreur est survenue');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue lors du changement');
            } finally {
              setIsChanging(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      ADMIN: 'Administrateur',
      MODERATOR: 'Modérateur',
      ACCOUNTANT: 'Comptable',
      DELIVERY: 'Livreur',
      COMMERCIAL: 'Commercial',
    };
    return labels[type] || type;
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* En-tête */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Paramètres
          </ThemedText>
        </View>

        {/* Informations du compte */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Informations du compte
          </ThemedText>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email:</ThemedText>
            <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Nom:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Non renseigné'}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Type de compte:</ThemedText>
            <ThemedText style={styles.infoValue}>{getAccountTypeLabel(user.accountType)}</ThemedText>
          </View>
        </View>

        {/* Changement de type de compte */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Type de compte
          </ThemedText>
          
          <ThemedText style={styles.sectionDescription}>
            Vous pouvez changer votre type de compte entre Acheteur et Vendeur.
          </ThemedText>

          {user.accountType === 'BUYER' && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => handleChangeAccountType('SELLER')}
              disabled={isChanging}
            >
              {isChanging ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  Devenir vendeur
                </ThemedText>
              )}
            </TouchableOpacity>
          )}

          {user.accountType === 'SELLER' && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleChangeAccountType('BUYER')}
              disabled={isChanging}
            >
              {isChanging ? (
                <ActivityIndicator color="#624cacff" />
              ) : (
                <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
                  Revenir à acheteur
                </ThemedText>
              )}
            </TouchableOpacity>
          )}

          {!['BUYER', 'SELLER'].includes(user.accountType) && (
            <ThemedText style={styles.infoText}>
              Les autres types de compte nécessitent une validation administrative.
            </ThemedText>
          )}
        </View>

        {/* Vérifications */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Vérifications
          </ThemedText>
          
          <View style={styles.verificationRow}>
            <ThemedText style={styles.verificationLabel}>Email vérifié:</ThemedText>
            <View style={[styles.statusBadge, user.emailVerified && styles.statusBadgeSuccess]}>
              <ThemedText style={styles.statusText}>
                {user.emailVerified ? '✓ Vérifié' : '✗ Non vérifié'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.verificationRow}>
            <ThemedText style={styles.verificationLabel}>Téléphone vérifié:</ThemedText>
            <View style={[styles.statusBadge, user.phoneVerified && styles.statusBadgeSuccess]}>
              <ThemedText style={styles.statusText}>
                {user.phoneVerified ? '✓ Vérifié' : '✗ Non vérifié'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Se déconnecter
              </ThemedText>
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
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    opacity: 0.8,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#624cacff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#624cacff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#624cacff',
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  verificationLabel: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 8,
  },
});


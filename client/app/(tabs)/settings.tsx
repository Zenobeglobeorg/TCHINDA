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
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { user, refreshUser, logout, isLoading: authLoading } = useAuth();
  const { themeMode, colorScheme, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const router = useRouter();
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
                
                // Attendre un peu pour que les données soient mises à jour
                await new Promise(resolve => setTimeout(resolve, 300));
                
                Alert.alert(
                  'Succès',
                  response.message || `Vous êtes maintenant ${newType === 'SELLER' ? 'vendeur' : 'acheteur'}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Rediriger selon le nouveau type de compte
                        if (newType === 'SELLER') {
                          router.replace('/seller/dashboard');
                        } else {
                          router.replace('/(tabs)');
                        }
                      },
                    },
                  ]
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
            try {
              setIsLoading(true);
              // Appeler logout qui nettoie les données
              await logout();
              // Attendre un peu pour s'assurer que le logout est terminé
              await new Promise(resolve => setTimeout(resolve, 100));
              // Rediriger vers la page de login après déconnexion
              router.replace('/Login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              // Même en cas d'erreur, essayer de rediriger
              try {
                router.replace('/Login');
              } catch (navError) {
                console.error('Erreur de navigation:', navError);
                Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
              }
            } finally {
              setIsLoading(false);
            }
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

  const styles = createStyles(colors);

  // Afficher un loader pendant le chargement initial
  if (authLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </ThemedView>
    );
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* En-tête */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Paramètres
            </ThemedText>
          </View>

          {/* Message pour utilisateur non connecté */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Connexion requise
            </ThemedText>
            
            <ThemedText style={styles.sectionDescription}>
              Connectez-vous pour accéder à vos paramètres et gérer votre compte.
            </ThemedText>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.buttonWithIcon]}
              onPress={() => {
                try {
                  router.replace('/Login');
                } catch (error) {
                  console.error('Erreur de navigation:', error);
                  // Fallback si router ne fonctionne pas
                  router.push('/Login');
                }
              }}
            >
              <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
              <ThemedText style={[styles.buttonText, styles.buttonTextWithIcon]}>
                Se connecter
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Apparence (accessible même sans connexion) */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Apparence
            </ThemedText>
            
            <View style={styles.themeRow}>
              <View style={styles.themeInfo}>
                <IconSymbol 
                  name={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'} 
                  size={24} 
                  color={colorScheme === 'dark' ? '#FFD700' : '#FFA500'} 
                />
                <View style={styles.themeTextContainer}>
                  <ThemedText style={styles.themeLabel}>Mode sombre</ThemedText>
                  <ThemedText style={styles.themeDescription}>
                    {themeMode === 'auto' 
                      ? 'Suivre les paramètres système' 
                      : themeMode === 'dark' 
                      ? 'Activé' 
                      : 'Désactivé'}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={colorScheme === 'dark'}
                onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            {/* Options de thème */}
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'light' && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode('light')}
              >
                <IconSymbol name="sun.max.fill" size={20} color={themeMode === 'light' ? colors.tint : colors.placeholder} />
                <ThemedText
                  style={[
                    styles.themeOptionText,
                    themeMode === 'light' && styles.themeOptionTextActive,
                  ]}
                >
                  Clair
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'dark' && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <IconSymbol name="moon.fill" size={20} color={themeMode === 'dark' ? colors.tint : colors.placeholder} />
                <ThemedText
                  style={[
                    styles.themeOptionText,
                    themeMode === 'dark' && styles.themeOptionTextActive,
                  ]}
                >
                  Sombre
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'auto' && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode('auto')}
              >
                <IconSymbol name="gearshape.fill" size={20} color={themeMode === 'auto' ? colors.tint : colors.placeholder} />
                <ThemedText
                  style={[
                    styles.themeOptionText,
                    themeMode === 'auto' && styles.themeOptionTextActive,
                  ]}
                >
                  Auto
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Si l'utilisateur est connecté
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
        {user.accountType === 'BUYER' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Type de compte
            </ThemedText>
            
            <ThemedText style={styles.sectionDescription}>
              Vous pouvez devenir vendeur pour vendre vos produits sur la plateforme.
            </ThemedText>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.buttonWithIcon]}
              onPress={() => handleChangeAccountType('SELLER')}
              disabled={isChanging}
            >
              {isChanging ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                  <ThemedText style={[styles.buttonText, styles.buttonTextWithIcon]}>
                    Devenir vendeur
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {user.accountType === 'SELLER' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Type de compte
            </ThemedText>
            
            <ThemedText style={styles.sectionDescription}>
              Vous pouvez revenir au mode acheteur si vous le souhaitez.
            </ThemedText>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleChangeAccountType('BUYER')}
              disabled={isChanging}
            >
              {isChanging ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
                  Revenir à acheteur
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!['BUYER', 'SELLER'].includes(user.accountType) && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Type de compte
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Les autres types de compte nécessitent une validation administrative.
            </ThemedText>
          </View>
        )}

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

        {/* Apparence */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Apparence
          </ThemedText>
          
          <View style={styles.themeRow}>
            <View style={styles.themeInfo}>
              <IconSymbol 
                name={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'} 
                size={24} 
                color={colorScheme === 'dark' ? '#FFD700' : '#FFA500'} 
              />
              <View style={styles.themeTextContainer}>
                <ThemedText style={styles.themeLabel}>Mode sombre</ThemedText>
                <ThemedText style={styles.themeDescription}>
                  {themeMode === 'auto' 
                    ? 'Suivre les paramètres système' 
                    : themeMode === 'dark' 
                    ? 'Activé' 
                    : 'Désactivé'}
                </ThemedText>
              </View>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {/* Options de thème */}
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'light' && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode('light')}
            >
              <IconSymbol name="sun.max.fill" size={20} color={themeMode === 'light' ? colors.tint : colors.placeholder} />
              <ThemedText
                style={[
                  styles.themeOptionText,
                  themeMode === 'light' && styles.themeOptionTextActive,
                ]}
              >
                Clair
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'dark' && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <IconSymbol name="moon.fill" size={20} color={themeMode === 'dark' ? colors.tint : colors.placeholder} />
              <ThemedText
                style={[
                  styles.themeOptionText,
                  themeMode === 'dark' && styles.themeOptionTextActive,
                ]}
              >
                Sombre
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'auto' && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode('auto')}
            >
              <IconSymbol name="gearshape.fill" size={20} color={themeMode === 'auto' ? colors.tint : colors.placeholder} />
              <ThemedText
                style={[
                  styles.themeOptionText,
                  themeMode === 'auto' && styles.themeOptionTextActive,
                ]}
              >
                Auto
              </ThemedText>
            </TouchableOpacity>
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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: colors.sectionBackground,
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
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    opacity: 0.8,
    color: colors.text,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 12,
  },
  buttonWithIcon: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonTextWithIcon: {
    marginLeft: 0,
  },
  primaryButton: {
    backgroundColor: colors.tint,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.tint,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: colors.tint,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  verificationLabel: {
    fontSize: 16,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.error + '20',
  },
  statusBadgeSuccess: {
    backgroundColor: colors.success + '20',
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
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.sectionBackground,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  themeOptionActive: {
    backgroundColor: colors.tint + '20',
    borderColor: colors.tint,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.placeholder,
  },
  themeOptionTextActive: {
    color: colors.tint,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


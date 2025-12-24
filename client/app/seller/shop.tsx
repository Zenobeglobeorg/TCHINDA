import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { sellerService, ShopInfo, ShopHours } from '@/services/seller.service';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ShopManagement() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [shopInfo, setShopInfo] = useState<ShopInfo>({});
  const [shopHours, setShopHours] = useState<ShopHours>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        setShopInfo({
          shopName: profile.shopName || '',
          shopDescription: profile.shopDescription || '',
          shopLogo: profile.shopLogo || '',
          shopBanner: profile.shopBanner || '',
          shopAddress: profile.shopAddress || '',
          shopPhone: profile.shopPhone || '',
          shopEmail: profile.shopEmail || '',
          shopCountry: profile.shopCountry || '',
          businessRegistration: profile.businessRegistration || '',
        });
        if (profile.shopHours) {
          setShopHours(profile.shopHours);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de la boutique');
    } finally {
      setLoading(false);
    }
  };

  const saveShopInfo = async () => {
    try {
      setSaving(true);
      const response = await sellerService.updateShopInfo(shopInfo);
      if (response.success) {
        Alert.alert('Succès', 'Informations de la boutique mises à jour');
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les informations');
    } finally {
      setSaving(false);
    }
  };

  const saveShopHours = async () => {
    try {
      setSaving(true);
      const response = await sellerService.updateShopHours(shopHours);
      if (response.success) {
        Alert.alert('Succès', 'Horaires de la boutique mis à jour');
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les horaires');
    } finally {
      setSaving(false);
    }
  };

  const updateDayHours = (day: string, field: 'open' | 'close' | 'isOpen', value: any) => {
    setShopHours((prev) => ({
      ...prev,
      [day.toLowerCase()]: {
        ...(prev[day.toLowerCase() as keyof ShopHours] as any),
        [field]: value,
      },
    }));
  };

  const handleSwitchToBuyer = async () => {
    Alert.alert(
      'Revenir en mode client',
      'Voulez-vous revenir en mode client (acheteur) ? Vous pourrez toujours revenir en mode vendeur plus tard.',
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
                  'Vous êtes maintenant en mode client',
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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayLabels: Record<string, string> = {
    Monday: 'Lundi',
    Tuesday: 'Mardi',
    Wednesday: 'Mercredi',
    Thursday: 'Jeudi',
    Friday: 'Vendredi',
    Saturday: 'Samedi',
    Sunday: 'Dimanche',
  };

  if (loading) {
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
      >
        {/* Informations de la boutique */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Informations de la boutique
          </ThemedText>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Nom de la boutique *</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopName}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopName: text })}
              placeholder="Nom de votre boutique"
              placeholderTextColor={textColor + '80'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Logo de la boutique</Text>
            {shopInfo.shopLogo ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: shopInfo.shopLogo }} style={styles.logoPreview} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: '#F44336' }]}
                  onPress={() => setShopInfo({ ...shopInfo, shopLogo: '' })}
                >
                  <Text style={styles.removeImageText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopLogo}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopLogo: text })}
              placeholder="URL du logo (ou chemin local)"
              placeholderTextColor={textColor + '80'}
            />
            <Text style={[styles.hint, { color: textColor }]}>
              Entrez l'URL de votre logo ou utilisez un service d'hébergement d'images
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Bannière de la boutique</Text>
            {shopInfo.shopBanner ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: shopInfo.shopBanner }} style={styles.bannerPreview} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: '#F44336' }]}
                  onPress={() => setShopInfo({ ...shopInfo, shopBanner: '' })}
                >
                  <Text style={styles.removeImageText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopBanner}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopBanner: text })}
              placeholder="URL de la bannière (ou chemin local)"
              placeholderTextColor={textColor + '80'}
            />
            <Text style={[styles.hint, { color: textColor }]}>
              Entrez l'URL de votre bannière (recommandé: 1200x300px)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Description</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor, color: textColor, borderColor: tintColor },
              ]}
              value={shopInfo.shopDescription}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopDescription: text })}
              placeholder="Description de votre boutique"
              placeholderTextColor={textColor + '80'}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Adresse</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopAddress}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopAddress: text })}
              placeholder="Adresse de la boutique"
              placeholderTextColor={textColor + '80'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Pays</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopCountry}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopCountry: text })}
              placeholder="Pays"
              placeholderTextColor={textColor + '80'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Téléphone</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopPhone}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopPhone: text })}
              placeholder="Téléphone de la boutique"
              placeholderTextColor={textColor + '80'}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.shopEmail}
              onChangeText={(text) => setShopInfo({ ...shopInfo, shopEmail: text })}
              placeholder="Email de la boutique"
              placeholderTextColor={textColor + '80'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Numéro d'enregistrement</Text>
            <TextInput
              style={[styles.input, { backgroundColor, color: textColor, borderColor: tintColor }]}
              value={shopInfo.businessRegistration}
              onChangeText={(text) => setShopInfo({ ...shopInfo, businessRegistration: text })}
              placeholder="Numéro d'enregistrement d'entreprise"
              placeholderTextColor={textColor + '80'}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={saveShopInfo}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer les informations</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Horaires de la boutique */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Horaires d'ouverture
          </ThemedText>

          {days.map((day) => {
            const dayKey = day.toLowerCase() as keyof ShopHours;
            const dayData = shopHours[dayKey] as any;

            return (
              <View key={day} style={[styles.dayRow, { backgroundColor }]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayLabel, { color: textColor }]}>
                    {dayLabels[day]}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      { backgroundColor: dayData?.isOpen ? tintColor : '#CCCCCC' },
                    ]}
                    onPress={() =>
                      updateDayHours(day, 'isOpen', !dayData?.isOpen)
                    }
                  >
                    <Text style={styles.toggleButtonText}>
                      {dayData?.isOpen ? 'Ouvert' : 'Fermé'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {dayData?.isOpen && (
                  <View style={styles.hoursRow}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        { backgroundColor, color: textColor, borderColor: tintColor },
                      ]}
                      value={dayData.open || ''}
                      onChangeText={(text) => updateDayHours(day, 'open', text)}
                      placeholder="09:00"
                      placeholderTextColor={textColor + '80'}
                    />
                    <Text style={[styles.timeSeparator, { color: textColor }]}>-</Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        { backgroundColor, color: textColor, borderColor: tintColor },
                      ]}
                      value={dayData.close || ''}
                      onChangeText={(text) => updateDayHours(day, 'close', text)}
                      placeholder="18:00"
                      placeholderTextColor={textColor + '80'}
                    />
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={saveShopHours}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer les horaires</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Option pour devenir client */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Compte
          </ThemedText>
          
          <ThemedText style={styles.sectionDescription}>
            Vous pouvez revenir en mode client (acheteur) à tout moment. Vous pourrez toujours revenir en mode vendeur plus tard.
          </ThemedText>

          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: tintColor }]}
            onPress={handleSwitchToBuyer}
            disabled={isChanging}
          >
            {isChanging ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                <Text style={styles.switchButtonText}>Devenir un client</Text>
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
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dayRow: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePreview: {
    marginBottom: 10,
    alignItems: 'center',
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  bannerPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  removeImageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
    marginTop: 10,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


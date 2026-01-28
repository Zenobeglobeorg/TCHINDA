import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function SellerProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    shopCountry: '',
    businessRegistration: '',
    firstName: '',
    lastName: '',
    phone: '',
    photo: null as string | null,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/seller/profile');
      if (response.success) {
        const profileData = response.data;
        setProfile(profileData);
        setFormData({
          shopName: profileData.shopName || '',
          shopDescription: profileData.shopDescription || '',
          shopAddress: profileData.shopAddress || '',
          shopPhone: profileData.shopPhone || '',
          shopEmail: profileData.shopEmail || '',
          shopCountry: profileData.shopCountry || '',
          businessRegistration: profileData.businessRegistration || '',
          firstName: profileData.user?.firstName || '',
          lastName: profileData.user?.lastName || '',
          phone: profileData.user?.phone || '',
          photo: profileData.user?.photo || profileData.shopLogo || null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, photo: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('shopName', formData.shopName);
      formDataToSend.append('shopDescription', formData.shopDescription);
      formDataToSend.append('shopAddress', formData.shopAddress);
      formDataToSend.append('shopPhone', formData.shopPhone);
      formDataToSend.append('shopEmail', formData.shopEmail);
      formDataToSend.append('shopCountry', formData.shopCountry);
      formDataToSend.append('businessRegistration', formData.businessRegistration);
      
      if (formData.photo && formData.photo.startsWith('file://')) {
        const filename = formData.photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formDataToSend.append('shopLogo', {
          uri: formData.photo,
          name: filename || 'photo.jpg',
          type,
        } as any);
      }

      const response = await apiService.put('/api/seller/profile', formDataToSend);
      
      if (response.success) {
        await refreshUser();
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        await loadProfile();
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Mon Profil Vendeur</ThemedText>
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {formData.photo ? (
              <Image source={{ uri: formData.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <IconSymbol name="storefront.fill" size={80} color="#CCC" />
              </View>
            )}
            <View style={styles.editPhotoBadge}>
              <IconSymbol name="camera.fill" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Shop Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informations de la boutique</ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Nom de la boutique *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.shopName}
              onChangeText={(text) => setFormData({ ...formData, shopName: text })}
              placeholder="Nom de votre boutique"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.shopDescription}
              onChangeText={(text) => setFormData({ ...formData, shopDescription: text })}
              placeholder="Décrivez votre boutique..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Adresse de la boutique</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.shopAddress}
              onChangeText={(text) => setFormData({ ...formData, shopAddress: text })}
              placeholder="Adresse complète"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <ThemedText style={styles.label}>Téléphone</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.shopPhone}
                onChangeText={(text) => setFormData({ ...formData, shopPhone: text })}
                placeholder="+237 6XX XXX XXX"
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.shopEmail}
                onChangeText={(text) => setFormData({ ...formData, shopEmail: text })}
                placeholder="boutique@example.com"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Pays</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.shopCountry}
              onChangeText={(text) => setFormData({ ...formData, shopCountry: text })}
              placeholder="Cameroun"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Numéro d'enregistrement</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.businessRegistration}
              onChangeText={(text) => setFormData({ ...formData, businessRegistration: text })}
              placeholder="Numéro d'enregistrement d'entreprise"
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informations personnelles</ThemedText>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <ThemedText style={styles.label}>Prénom</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Prénom"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={styles.label}>Nom</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Nom"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Téléphone</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+237 6XX XXX XXX"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Enregistrer</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#624cacff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#624cacff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

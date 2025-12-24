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
// Image picker will be implemented with a simpler approach
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    city: '',
    address: '',
    postalCode: '',
    photo: null as string | null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        country: user.country || '',
        city: user.city || '',
        address: user.address || '',
        postalCode: user.postalCode || '',
        photo: user.photo || null,
      });
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const response = await apiService.get('/api/buyer/addresses');
      if (response.success) {
        setAddresses(response.data || []);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const pickImage = async () => {
    // For now, we'll use a URL input. In production, implement proper image picker
    // Note: Alert.prompt is iOS only, for cross-platform use a TextInput modal
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'URL de la photo',
        'Entrez l\'URL de votre photo de profil',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'OK',
            onPress: (url) => {
              if (url) {
                setFormData({ ...formData, photo: url });
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      // For Android/Web, show a simple alert with instructions
      Alert.alert(
        'Photo de profil',
        'Pour ajouter une photo, entrez l\'URL de l\'image dans le champ photo ci-dessous.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phone', formData.phone);
      if (formData.dateOfBirth) {
        formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      }
      formDataToSend.append('country', formData.country);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('postalCode', formData.postalCode);
      
      if (formData.photo && formData.photo.startsWith('file://')) {
        const filename = formData.photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formDataToSend.append('photo', {
          uri: formData.photo,
          name: filename || 'photo.jpg',
          type,
        } as any);
      }

      const response = await apiService.put('/api/buyer/profile', formDataToSend);
      
      if (response.success) {
        await refreshUser();
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      'Supprimer l\'adresse',
      'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete(`/api/buyer/addresses/${addressId}`);
              if (response.success) {
                await loadAddresses();
                Alert.alert('Succès', 'Adresse supprimée');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
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
          <ThemedText style={styles.title}>Mon Profil</ThemedText>
          <TouchableOpacity onPress={() => router.push('/buyer/verification')}>
            <View style={styles.verificationBadge}>
              <ThemedText style={styles.verificationText}>
                {user?.verificationStatus === 'VERIFIED' ? '✓ Vérifié' : 'Vérifier'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {formData.photo ? (
              <Image source={{ uri: formData.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <IconSymbol name="person.circle.fill" size={80} color="#CCC" />
              </View>
            )}
            <View style={styles.editPhotoBadge}>
              <IconSymbol name="camera.fill" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
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
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Date de naissance</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Adresse principale</ThemedText>
          </View>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Pays de résidence</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              placeholder="France"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
              <ThemedText style={styles.label}>Ville</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Paris"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={styles.label}>Code postal</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.postalCode}
                onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                placeholder="75001"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Adresse</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="123 Rue Example"
              multiline
            />
          </View>
        </View>

        {/* Multiple Addresses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Adresses supplémentaires</ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/buyer/addresses/new')}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#624cacff" />
            </TouchableOpacity>
          </View>

          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <ThemedText style={styles.addressLabel}>{address.label}</ThemedText>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <ThemedText style={styles.defaultText}>Par défaut</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={styles.addressText}>
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                {address.postalCode} {address.city}, {address.country}
              </ThemedText>
              <View style={styles.addressActions}>
                <TouchableOpacity
                  onPress={() => router.push(`/buyer/addresses/${address.id}`)}
                >
                  <ThemedText style={styles.editLink}>Modifier</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteAddress(address.id)}>
                  <ThemedText style={styles.deleteLink}>Supprimer</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {addresses.length === 0 && (
            <ThemedText style={styles.emptyText}>
              Aucune adresse supplémentaire. Ajoutez-en une pour faciliter vos commandes.
            </ThemedText>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  verificationBadge: {
    backgroundColor: '#624cacff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  addButton: {
    padding: 4,
  },
  addressCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#624cacff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  editLink: {
    color: '#624cacff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteLink: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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


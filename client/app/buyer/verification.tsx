import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiService } from '@/services/api.service';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import * as ImagePicker from 'expo-image-picker';

export default function VerificationScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'phone' | 'kyc'>('email');
  
  // Email verification
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  
  // Phone verification
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  
  // KYC
  const [kycData, setKycData] = useState({
    documentType: '',
    documentNumber: '',
    documentFront: '',
    documentBack: '',
    selfie: '',
  });
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const setKycField = (field: keyof typeof kycData, next: string) => {
    setKycData((prev) => {
      const current = prev[field];
      // cleanup web blob URLs to avoid memory leak
      if (Platform.OS === 'web') {
        try {
          if (current && typeof current === 'string' && current.startsWith('blob:') && current !== next) {
            URL.revokeObjectURL(current);
          }
        } catch {}
      }
      return { ...prev, [field]: next };
    });
  };

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await apiService.get('/api/buyer/verification');
      if (response.success) {
        setVerificationStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const requestEmailVerification = async () => {
    setLoading(true);
    try {
      const response = await apiService.post('/api/buyer/verification/email');
      if (response.success) {
        setEmailCodeSent(true);
        Alert.alert('Succès', 'Code de vérification envoyé par email');
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!emailCode || emailCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer un code valide (6 chiffres)');
      return;
    }

    setLoading(true);
    try {
      const email = user?.email;
      if (!email) throw new Error('Email utilisateur manquant');

      const response = await authService.verifyEmail(email, emailCode);
      if (!response.success) {
        throw new Error(response.error?.message || 'Code invalide ou expiré');
      }

      Alert.alert('Succès', 'Email vérifié avec succès');
      await refreshUser();
      await loadVerificationStatus();
      setEmailCode('');
      setEmailCodeSent(false);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneVerification = async () => {
    if (!user?.phone) {
      Alert.alert('Erreur', 'Veuillez d\'abord ajouter un numéro de téléphone dans votre profil');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/api/buyer/verification/phone');
      if (response.success) {
        setPhoneCodeSent(true);
        Alert.alert('Succès', 'Code de vérification envoyé par SMS');
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneCode || phoneCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer un code valide (6 chiffres)');
      return;
    }

    setLoading(true);
    try {
      const phone = user?.phone;
      if (!phone) throw new Error('Numéro de téléphone manquant');

      const response = await authService.verifyPhone(phone, phoneCode);
      if (!response.success) {
        throw new Error(response.error?.message || 'Code invalide ou expiré');
      }

      Alert.alert('Succès', 'Téléphone vérifié avec succès');
      await refreshUser();
      await loadVerificationStatus();
      setPhoneCode('');
      setPhoneCodeSent(false);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickKycFile = async (field: 'documentFront' | 'documentBack' | 'selfie') => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.multiple = false;
        input.onchange = () => {
          const file = (input.files && input.files[0]) || null;
          if (!file) return;
          const uri = URL.createObjectURL(file);
          setKycField(field, uri);
        };
        input.click();
        return;
      }

      // Mobile: camera / galerie (comme produits)
      Alert.alert(
        'Choisir un document',
        'Choisissez une option',
        [
          {
            text: 'Caméra',
            onPress: async () => {
              try {
                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                if (cameraStatus !== 'granted') {
                  Alert.alert('Permissions requises', 'Autorisez l’accès à la caméra.');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.8,
                  allowsEditing: false,
                });

                if (!result.canceled && result.assets && result.assets[0]?.uri) {
                  setKycField(field, result.assets[0].uri);
                }
              } catch {
                Alert.alert('Erreur', "Impossible d'accéder à la caméra");
              }
            },
          },
          {
            text: 'Galerie',
            onPress: async () => {
              try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permissions requises', 'Autorisez l’accès à la galerie.');
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.8,
                  allowsEditing: false,
                });

                if (!result.canceled && result.assets && result.assets[0]?.uri) {
                  setKycField(field, result.assets[0].uri);
                }
              } catch {
                Alert.alert('Erreur', "Impossible d'ouvrir la galerie");
              }
            },
          },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir le sélecteur de fichiers");
    }
  };

  const submitKYC = async () => {
    if (!kycData.documentType || !kycData.documentNumber) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setKycSubmitting(true);
    try {
      // Envoyer en multipart/form-data si on a des fichiers locaux; sinon fallback JSON
      const hasLocalFiles =
        (kycData.documentFront && !/^https?:\/\//i.test(kycData.documentFront)) ||
        (kycData.documentBack && !/^https?:\/\//i.test(kycData.documentBack)) ||
        (kycData.selfie && !/^https?:\/\//i.test(kycData.selfie));

      let response;
      if (hasLocalFiles) {
        const fd = new FormData();
        fd.append('documentType', kycData.documentType);
        fd.append('documentNumber', kycData.documentNumber);

        const appendFile = async (field: string, uri: string, filename: string) => {
          if (!uri) return;
          if (/^https?:\/\//i.test(uri)) return; // déjà distant

          if (Platform.OS === 'web') {
            const resp = await fetch(uri);
            const blob = await resp.blob();
            // @ts-ignore
            fd.append(field, blob, filename);
          } else {
            // @ts-ignore
            fd.append(field, { uri, name: filename, type: 'image/jpeg' });
          }
        };

        if (kycData.documentFront) {
          await appendFile('documentFront', kycData.documentFront, `kyc-front-${Date.now()}.jpg`);
        }
        if (kycData.documentBack) {
          await appendFile('documentBack', kycData.documentBack, `kyc-back-${Date.now()}.jpg`);
        }
        if (kycData.selfie) {
          await appendFile('selfie', kycData.selfie, `kyc-selfie-${Date.now()}.jpg`);
        }

        response = await apiService.post('/api/buyer/verification/kyc', fd);
      } else {
        response = await apiService.post('/api/buyer/verification/kyc', kycData);
      }

      if (response.success) {
        Alert.alert(
          'Succès',
          'Votre demande KYC a été soumise. Elle sera examinée sous 24-48h.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await loadVerificationStatus();

                // cleanup blob urls on web
                if (Platform.OS === 'web') {
                  try {
                    if (kycData.documentFront?.startsWith('blob:')) URL.revokeObjectURL(kycData.documentFront);
                    if (kycData.documentBack?.startsWith('blob:')) URL.revokeObjectURL(kycData.documentBack);
                    if (kycData.selfie?.startsWith('blob:')) URL.revokeObjectURL(kycData.selfie);
                  } catch {}
                }

                setKycData({
                  documentType: '',
                  documentNumber: '',
                  documentFront: '',
                  documentBack: '',
                  selfie: '',
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', response.error?.message || 'Erreur lors de la soumission');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setKycSubmitting(false);
    }
  };

  const getStatusBadge = (verified: boolean, status?: string) => {
    if (verified) {
      return (
        <View style={styles.statusBadgeSuccess}>
          <IconSymbol name="checkmark.circle.fill" size={16} color="#28A745" />
          <ThemedText style={styles.statusTextSuccess}>Vérifié</ThemedText>
        </View>
      );
    }
    if (status === 'PENDING') {
      return (
        <View style={styles.statusBadgePending}>
          <IconSymbol name="clock.fill" size={16} color="#FFC107" />
          <ThemedText style={styles.statusTextPending}>En attente</ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.statusBadgeUnverified}>
        <IconSymbol name="xmark.circle.fill" size={16} color="#DC3545" />
        <ThemedText style={styles.statusTextUnverified}>Non vérifié</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Vérification du compte</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Overview */}
        <View style={styles.statusOverview}>
          <ThemedText style={styles.statusOverviewTitle}>Statut de vérification</ThemedText>
          <View style={styles.statusOverviewGrid}>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusItemLabel}>Email</ThemedText>
              {getStatusBadge(verificationStatus?.emailVerified || user?.emailVerified)}
            </View>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusItemLabel}>Téléphone</ThemedText>
              {getStatusBadge(verificationStatus?.phoneVerified || user?.phoneVerified)}
            </View>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusItemLabel}>KYC</ThemedText>
              {getStatusBadge(
                verificationStatus?.kycVerified || user?.kycVerified,
                verificationStatus?.verificationStatus
              )}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'email' && styles.tabActive]}
            onPress={() => setActiveTab('email')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
              Email
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'phone' && styles.tabActive]}
            onPress={() => setActiveTab('phone')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'phone' && styles.tabTextActive]}>
              Téléphone
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'kyc' && styles.tabActive]}
            onPress={() => setActiveTab('kyc')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'kyc' && styles.tabTextActive]}>
              KYC
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Email Verification */}
        {activeTab === 'email' && (
          <View style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>Vérification Email</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Vérifiez votre adresse email pour sécuriser votre compte
            </ThemedText>

            {user?.emailVerified ? (
              <View style={styles.verifiedCard}>
                <IconSymbol name="checkmark.circle.fill" size={48} color="#28A745" />
                <ThemedText style={styles.verifiedText}>Email vérifié</ThemedText>
                <ThemedText style={styles.verifiedEmail}>{user.email}</ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.infoCard}>
                  <ThemedText style={styles.infoText}>
                    Un code de vérification sera envoyé à : {user?.email}
                  </ThemedText>
                </View>

                {!emailCodeSent ? (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={requestEmailVerification}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <ThemedText style={styles.sendButtonText}>
                        Envoyer le code
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <ThemedText style={styles.inputLabel}>Code de vérification</ThemedText>
                      <TextInput
                        style={styles.codeInput}
                        placeholder="000000"
                        value={emailCode}
                        onChangeText={setEmailCode}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={verifyEmailCode}
                      disabled={loading || !emailCode}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <ThemedText style={styles.verifyButtonText}>Vérifier</ThemedText>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={requestEmailVerification}
                    >
                      <ThemedText style={styles.resendButtonText}>Renvoyer le code</ThemedText>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* Phone Verification */}
        {activeTab === 'phone' && (
          <View style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>Vérification Téléphone</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Vérifiez votre numéro de téléphone pour sécuriser votre compte
            </ThemedText>

            {user?.phoneVerified ? (
              <View style={styles.verifiedCard}>
                <IconSymbol name="checkmark.circle.fill" size={48} color="#28A745" />
                <ThemedText style={styles.verifiedText}>Téléphone vérifié</ThemedText>
                <ThemedText style={styles.verifiedEmail}>{user.phone}</ThemedText>
              </View>
            ) : (
              <>
                {!user?.phone && (
                  <View style={styles.warningCard}>
                    <IconSymbol name="info.circle.fill" size={20} color="#FFC107" />
                    <ThemedText style={styles.warningText}>
                      Veuillez d'abord ajouter un numéro de téléphone dans votre profil
                    </ThemedText>
                  </View>
                )}

                {!phoneCodeSent ? (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={requestPhoneVerification}
                    disabled={loading || !user?.phone}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <ThemedText style={styles.sendButtonText}>
                        Envoyer le code SMS
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <ThemedText style={styles.inputLabel}>Code de vérification</ThemedText>
                      <TextInput
                        style={styles.codeInput}
                        placeholder="000000"
                        value={phoneCode}
                        onChangeText={setPhoneCode}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={verifyPhoneCode}
                      disabled={loading || !phoneCode}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <ThemedText style={styles.verifyButtonText}>Vérifier</ThemedText>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={requestPhoneVerification}
                    >
                      <ThemedText style={styles.resendButtonText}>Renvoyer le code</ThemedText>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* KYC Verification */}
        {activeTab === 'kyc' && (
          <View style={styles.tabContent}>
            <ThemedText style={styles.sectionTitle}>Vérification KYC</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Complétez votre vérification d'identité pour augmenter vos limites
            </ThemedText>

            {user?.kycVerified ? (
              <View style={styles.verifiedCard}>
                <IconSymbol name="checkmark.circle.fill" size={48} color="#28A745" />
                <ThemedText style={styles.verifiedText}>KYC Vérifié</ThemedText>
                <ThemedText style={styles.verifiedDescription}>
                  Votre identité a été vérifiée avec succès
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Type de document *</ThemedText>
                  <View style={styles.documentTypeSelector}>
                    {['CNI', 'Passeport', 'Permis de conduire'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.documentTypeButton,
                          kycData.documentType === type && styles.documentTypeButtonActive,
                        ]}
                        onPress={() => setKycData({ ...kycData, documentType: type })}
                      >
                        <ThemedText
                          style={[
                            styles.documentTypeText,
                            kycData.documentType === type && styles.documentTypeTextActive,
                          ]}
                        >
                          {type}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Numéro de document *</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrez le numéro du document"
                    value={kycData.documentNumber}
                    onChangeText={(text) => setKycData({ ...kycData, documentNumber: text })}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Document recto (photo/fichier)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Choisir un fichier ou coller une URL"
                    value={kycData.documentFront}
                    onChangeText={(text) => setKycData({ ...kycData, documentFront: text })}
                  />
                  <TouchableOpacity style={styles.resendButton} onPress={() => pickKycFile('documentFront')}>
                    <ThemedText style={styles.resendButtonText}>Choisir un fichier</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Document verso (photo/fichier)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Choisir un fichier ou coller une URL"
                    value={kycData.documentBack}
                    onChangeText={(text) => setKycData({ ...kycData, documentBack: text })}
                  />
                  <TouchableOpacity style={styles.resendButton} onPress={() => pickKycFile('documentBack')}>
                    <ThemedText style={styles.resendButtonText}>Choisir un fichier</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Selfie avec document (photo/fichier)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Choisir un fichier ou coller une URL"
                    value={kycData.selfie}
                    onChangeText={(text) => setKycData({ ...kycData, selfie: text })}
                  />
                  <TouchableOpacity style={styles.resendButton} onPress={() => pickKycFile('selfie')}>
                    <ThemedText style={styles.resendButtonText}>Choisir un fichier</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                  <IconSymbol name="info.circle.fill" size={20} color="#624cacff" />
                  <ThemedText style={styles.infoText}>
                    Votre demande sera examinée sous 24-48h. Vous recevrez une notification une fois la vérification terminée.
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitKYC}
                  disabled={kycSubmitting || !kycData.documentType || !kycData.documentNumber}
                >
                  {kycSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>Soumettre la demande KYC</ThemedText>
                  )}
                </TouchableOpacity>
              </>
            )}
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusOverview: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOverviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusOverviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    gap: 8,
  },
  statusItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusBadgeUnverified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusTextSuccess: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28A745',
  },
  statusTextPending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC107',
  },
  statusTextUnverified: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC3545',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#624cacff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFF',
  },
  tabContent: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  verifiedCard: {
    backgroundColor: '#D4EDDA',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28A745',
  },
  verifiedEmail: {
    fontSize: 14,
    color: '#666',
  },
  verifiedDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
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
  codeInput: {
    borderWidth: 2,
    borderColor: '#624cacff',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#FFF',
    fontWeight: 'bold',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  documentTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  documentTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentTypeButtonActive: {
    backgroundColor: '#624cacff',
    borderColor: '#624cacff',
  },
  documentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  documentTypeTextActive: {
    color: '#FFF',
  },
  sendButton: {
    backgroundColor: '#624cacff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#624cacff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#624cacff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



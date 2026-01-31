import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { alert } from '@/utils/alert';

export default function SignUpScreen() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('SN');
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  
  // Type de compte fixé à BUYER pour l'inscription
  const accountType: 'BUYER' = 'BUYER';

  const countries = [
    { label: 'Sénégal', value: 'SN' },
    { label: "Côte d'Ivoire", value: 'CI' },
    { label: 'Cameroun', value: 'CM' },
    { label: 'Gabon', value: 'GA' },
    { label: 'Maroc', value: 'MA' },
    { label: 'Autre', value: '' },
  ];

  const selectedCountryLabel = countries.find(c => c.value === country)?.label || 'Sénégal';

  const handleSignUp = async () => {
    // Validations
    if (!firstName.trim()) {
      alert('Erreur', 'Veuillez entrer votre prénom');
      return;
    }

    if (!lastName.trim()) {
      alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (!email.trim()) {
      alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    // Validation téléphone (si fourni)
    if (phone.trim()) {
      // Nettoyer le téléphone pour la validation
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      // Format attendu par le backend : +237679974577 (pas d'espaces)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(cleanPhone)) {
        alert(
          'Erreur',
          'Numéro de téléphone invalide. Format attendu : +237679974577 (sans espaces, commence par + suivi du code pays)'
        );
        return;
      }
    }

    if (!password.trim()) {
      alert('Erreur', 'Veuillez entrer un mot de passe');
      return;
    }

    if (password.length < 8) {
      alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Validation force du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      alert(
        'Erreur',
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      );
      return;
    }

    if (password !== confirmPassword) {
      alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      // Nettoyer le téléphone : supprimer les espaces et garder seulement les chiffres et le +
      const cleanPhone = phone.trim() ? phone.trim().replace(/\s+/g, '') : undefined;

      const result = await register({
        email: email.trim(),
        password,
        accountType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone || undefined,
        country: country || undefined,
      });

      if (result.success) {
        alert('Succès', 'Compte créé avec succès', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        // Afficher le message d'erreur du backend avec les détails si disponibles
        let errorMessage = 'Une erreur est survenue';
        
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error;
          } else if (result.error.message) {
            errorMessage = result.error.message;
            
            // Si des détails de validation sont disponibles, les ajouter
            if (result.error.details && Array.isArray(result.error.details) && result.error.details.length > 0) {
              const validationErrors = result.error.details
                .map((err: any) => err.msg || err.message || JSON.stringify(err))
                .join('\n');
              errorMessage = `${errorMessage}\n\n${validationErrors}`;
            }
          }
        }
        
        alert('Erreur d\'inscription', errorMessage);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      alert('Erreur', error.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/Login');
  };

  const loading = isLoading || authLoading;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            Platform.OS === 'web' && styles.scrollContainerWeb
          ]}
        >
          {/* Wrapper centré pour web */}
          <View style={Platform.OS === 'web' ? styles.webWrapper : undefined}>
          {/* En-tête */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Inscription
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Créez votre compte Acheteur TCHINDA
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Vous pourrez devenir vendeur plus tard dans les paramètres
            </ThemedText>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Prénom</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Nom</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Téléphone (optionnel)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="+221 77 123 45 67"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Pays</ThemedText>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => !loading && setShowCountryModal(true)}
                disabled={loading}
              >
                <ThemedText style={styles.pickerText}>{selectedCountryLabel}</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Country Selection Modal */}
            <Modal
              visible={showCountryModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowCountryModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Sélectionner un pays</ThemedText>
                    <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                      <ThemedText style={styles.modalCloseButton}>✕</ThemedText>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={countries}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.countryOption,
                          country === item.value && styles.countryOptionSelected,
                        ]}
                        onPress={() => {
                          setCountry(item.value);
                          setShowCountryModal(false);
                        }}
                      >
                        <ThemedText
                          style={[
                            styles.countryOptionText,
                            country === item.value && styles.countryOptionTextSelected,
                          ]}
                        >
                          {item.label}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Mot de passe *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Min. 8 caractères avec majuscule, chiffre et caractère spécial"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirmer le mot de passe *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.signUpButton,
                loading && styles.signUpButtonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.signUpButtonText}>
                  S'inscrire
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Ligne séparatrice */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <ThemedText style={styles.separatorText}>Ou</ThemedText>
            <View style={styles.separatorLine} />
          </View>

          {/* Lien vers la connexion */}
          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>
              Vous avez déjà un compte ?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <ThemedText style={styles.loginLink}>
                Se connecter
              </ThemedText>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      backgroundColor: '#F5F7FA',
      minHeight: '100vh',
    }),
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainerWeb: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      minHeight: '100vh',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    }),
  },
  webWrapper: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      width: '100%',
      maxWidth: 520,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 40,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      marginVertical: 20,
      marginHorizontal: 0,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      outlineWidth: 0,
      outlineStyle: 'none',
    }),
  },
  pickerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    minHeight: 50,
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      cursor: 'pointer',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      ':hover': {
        borderColor: '#624cacff',
        boxShadow: '0 0 0 3px rgba(98, 76, 172, 0.1)',
      } as any,
    }),
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#999',
  },
  countryOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryOptionSelected: {
    backgroundColor: 'rgba(98, 76, 172, 0.1)',
  },
  countryOptionText: {
    fontSize: 16,
    color: '#000',
  },
  countryOptionTextSelected: {
    color: '#624cacff',
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: '#624cacff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      cursor: 'pointer',
      transition: 'background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease',
      boxShadow: '0 2px 8px rgba(98, 76, 172, 0.2)',
      ':hover': {
        backgroundColor: '#5a45a0',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(98, 76, 172, 0.3)',
      } as any,
      ':active': {
        transform: 'translateY(0)',
      } as any,
    }),
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  separatorText: {
    marginHorizontal: 10,
    opacity: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    color: '#A1CEDC',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

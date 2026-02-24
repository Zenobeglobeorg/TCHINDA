import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authService } from '@/services/auth.service';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string>('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    const resetToken = params.token as string;
    if (resetToken) {
      setToken(resetToken);
    } else {
      Alert.alert('Erreur', 'Token de réinitialisation invalide', [
        { text: 'OK', onPress: () => router.replace('/Login') }
      ]);
    }
  }, [params]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(pwd)) {
      return 'Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    // Validation
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez confirmer votre mot de passe');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      Alert.alert('Erreur', validationError);
      return;
    }

    if (!token) {
      Alert.alert('Erreur', 'Token de réinitialisation invalide');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.resetPassword(token, password);
      
      if (result.success) {
        Alert.alert(
          'Succès',
          'Votre mot de passe a été réinitialisé avec succès',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/Login')
            }
          ]
        );
      } else {
        Alert.alert('Erreur', result.error?.message || 'Une erreur est survenue');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* En-tête avec Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/assets_images_logo.webp')}
                style={styles.logo}
                resizeMode="contain"
              />
              <ThemedText type="title" style={styles.appName}>
                TCHINDA
              </ThemedText>
            </View>
            
            <ThemedText type="title" style={styles.title}>
              Réinitialiser le mot de passe
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Entrez votre nouveau mot de passe
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Nouveau mot de passe</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, color: 'black', borderColor: tintColor }]}
                placeholder="Votre nouveau mot de passe"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
              <ThemedText style={styles.hint}>
                Min. 8 caractères, majuscule, minuscule, chiffre et caractère spécial
              </ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirmer le mot de passe</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, color: 'black', borderColor: tintColor }]}
                placeholder="Confirmer votre mot de passe"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: tintColor }, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  Réinitialiser
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Lien vers la connexion */}
          <View style={styles.backContainer}>
            <TouchableOpacity onPress={() => router.replace('/Login')} disabled={isLoading}>
              <ThemedText style={styles.backLink}>
                Retour à la connexion
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(161, 206, 220, 0.1)'
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#A1CEDC',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3D47',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
  },
  form: {
    width: '100%',
    marginBottom: 30,
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 5,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backLink: {
    color: '#A1CEDC',
    fontSize: 14,
    fontWeight: 'bold',
  },
});



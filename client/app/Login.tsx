import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading: authLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (user) {
      if (user.accountType === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user]);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        // La redirection se fera automatiquement via useEffect quand user sera mis à jour
        // Pas besoin de rediriger ici, useEffect s'en chargera
      } else {
        Alert.alert('Erreur de connexion', result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/SignUp');
  };

  const handleGoogleLogin = () => {
    Alert.alert('Info', 'Connexion Google (à implémenter)');
  };

  const handleFacebookLogin = () => {
    Alert.alert('Info', 'Connexion Facebook (à implémenter)');
  };

  const handleAppleLogin = () => {
    Alert.alert('Info', 'Connexion Apple (à implémenter)');
  };

  const loading = isLoading || authLoading;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* En-tête avec Logo */}
          <View style={styles.header}>
            {/* Logo TCHINDA */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <ThemedText type="title" style={styles.appName}>
                TCHINDA
              </ThemedText>
            </View>
            
            <ThemedText type="title" style={styles.title}>
              Bon retour
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Connectez-vous à votre compte TCHINDA
            </ThemedText>
          </View>

          {/* Formulaire de connexion classique */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
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
              <ThemedText style={styles.label}>Mot de passe</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Votre mot de passe"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
              <ThemedText style={styles.forgotPasswordText}>
                Mot de passe oublié ?
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.loginButtonText}>
                  Se connecter
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Ligne séparatrice */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <ThemedText style={styles.separatorText}>Ou connectez-vous avec</ThemedText>
            <View style={styles.separatorLine} />
          </View>

          {/* Boutons de connexion sociale */}
          <View style={styles.socialButtonsContainer}>
            <ThemedText style={styles.socialTitle}>
              Continuer avec
            </ThemedText>
            
            <View style={styles.socialIconsContainer}>
              <TouchableOpacity 
                style={[styles.socialIconButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <Image
                  source={require('@/assets/images/google.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialIconButton, styles.facebookButton]}
                onPress={handleFacebookLogin}
                disabled={loading}
              >
                <Image
                  source={require('@/assets/images/facebook.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialIconButton, styles.appleButton]}
                onPress={handleAppleLogin}
                disabled={loading}
              >
                <Image
                  source={require('@/assets/images/apple.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.socialLabelsContainer}>
              <ThemedText style={styles.socialLabel}>Google</ThemedText>
              <ThemedText style={styles.socialLabel}>Facebook</ThemedText>
              <ThemedText style={styles.socialLabel}>Apple</ThemedText>
            </View>
          </View>

          {/* Lien vers l'inscription */}
          <View style={styles.signUpContainer}>
            <ThemedText style={styles.signUpText}>
              Vous n'avez pas de compte ?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <ThemedText style={styles.signUpLink}>
                S'inscrire
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#A1CEDC',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#624cacff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
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
    fontSize: 14,
    textAlign: 'center',
  },
  socialButtonsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    opacity: 0.8,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 25,
  },
  socialIconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialIcon: {
    width: 30,
    height: 30,
  },
  socialLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginTop: 5,
  },
  socialLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    minWidth: 60,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 50
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    color: '#A1CEDC',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

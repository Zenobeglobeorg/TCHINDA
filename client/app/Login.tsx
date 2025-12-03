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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simulation de l'authentification
    setTimeout(() => {
      setIsLoading(false);
      // Navigation vers l'écran principal après connexion réussie
      router.push('/(tabs)');
    }, 1500);
  };

  const handleSignUp = () => {
    router.push('/SignUp');
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulation de connexion Google
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(tabs)');
    }, 1500);
  };

  const handleFacebookLogin = () => {
    setIsLoading(true);
    // Simulation de connexion Facebook
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(tabs)');
    }, 1500);
  };

  const handleAppleLogin = () => {
    setIsLoading(true);
    // Simulation de connexion Apple
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(tabs)');
    }, 1500);
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
            {/* Logo TCHINDA */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo.png')} // Utilise votre logo
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
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                Mot de passe oublié ?
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <ThemedText style={styles.loginButtonText}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Ligne séparatrice */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <ThemedText style={styles.separatorText}>Ou connectez-vous avec</ThemedText>
            <View style={styles.separatorLine} />
          </View>

          {/* Boutons de connexion sociale EN DESSOUS du formulaire */}
          <View style={styles.socialButtonsContainer}>
            <ThemedText style={styles.socialTitle}>
              Continuer avec
            </ThemedText>
            
            <View style={styles.socialIconsContainer}>
              <TouchableOpacity 
                style={[styles.socialIconButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Image
                  source={require('@/assets/images/google.png')} // Ajoutez votre icône Google
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialIconButton, styles.facebookButton]}
                onPress={handleFacebookLogin}
                disabled={isLoading}
              >
                <Image
                  source={require('@/assets/images/facebook.png')} // Ajoutez votre icône Facebook
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialIconButton, styles.appleButton]}
                onPress={handleAppleLogin}
                disabled={isLoading}
              >
                <Image
                  source={require('@/assets/images/apple.png')} // Ajoutez votre icône Apple
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
            <TouchableOpacity onPress={handleSignUp}>
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
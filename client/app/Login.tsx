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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { signInWithGoogle, signInWithFacebook, signInWithApple } from '@/utils/oauth';
import { alert } from '@/utils/alert';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading: authLoading, user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (user) {
      if (user.accountType === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (user.accountType === 'SELLER') {
        router.replace('/seller/dashboard');
      } else if (user.accountType === 'COMMERCIAL') {
        router.replace('/commercial/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user]);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!password.trim()) {
      alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        // Attendre un peu pour que l'utilisateur soit mis à jour
        setTimeout(() => {
          // La redirection se fera automatiquement via useEffect quand user sera mis à jour
        }, 100);
      } else {
        alert('Erreur de connexion', result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      alert('Erreur', 'Veuillez entrer votre email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authService.requestLoginOtp(email.trim());
      if (!resp.success) {
        alert('Erreur', resp.error?.message || 'Impossible d’envoyer le code');
        return;
      }
      setOtpSent(true);
      alert('Succès', 'Un code a été envoyé par email (valide 10 minutes).');
    } catch (e: any) {
      alert('Erreur', e.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!email.trim()) {
      alert('Erreur', 'Veuillez entrer votre email');
      return;
    }
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      alert('Erreur', 'Veuillez entrer un code valide (6 chiffres)');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authService.loginWithOtp({ email: email.trim(), code: otpCode.trim() });
      if (!resp.success || !resp.data) {
        alert('Erreur de connexion', resp.error?.message || 'Code invalide ou expiré');
        return;
      }
      await refreshUser();
      // La redirection se fera via useEffect(user)
    } catch (e: any) {
      alert('Erreur', e.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/SignUp');
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const oauthResult = await signInWithGoogle();
      
      if (!oauthResult.success) {
        Alert.alert('Erreur', oauthResult.error || 'Erreur lors de la connexion Google');
        return;
      }

      const result = await authService.loginWithGoogle(
        oauthResult.userData!,
        oauthResult.idToken!,
        oauthResult.accessToken || ''
      );

      if (result.success) {
        await refreshUser();
        // La redirection se fera automatiquement via useEffect quand user sera mis à jour
      } else {
        Alert.alert('Erreur', result.error?.message || 'Erreur lors de la connexion Google');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      const oauthResult = await signInWithFacebook();
      
      if (!oauthResult.success) {
        Alert.alert('Erreur', oauthResult.error || 'Erreur lors de la connexion Facebook');
        return;
      }

      const result = await authService.loginWithFacebook(
        oauthResult.userData!,
        oauthResult.accessToken!
      );

      if (result.success) {
        await refreshUser();
        setTimeout(() => {
          if (user) {
            if (user.accountType === 'ADMIN') {
              router.replace('/admin/dashboard');
            } else if (user.accountType === 'SELLER') {
              router.replace('/seller/dashboard');
            } else if (user.accountType === 'COMMERCIAL') {
              router.replace('/commercial/dashboard');
            } else {
              router.replace('/(tabs)');
            }
          }
        }, 100);
      } else {
        Alert.alert('Erreur', result.error?.message || 'Erreur lors de la connexion Facebook');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      const oauthResult = await signInWithApple();
      
      if (!oauthResult.success) {
        Alert.alert('Erreur', oauthResult.error || 'Erreur lors de la connexion Apple');
        return;
      }

      const result = await authService.loginWithApple(
        oauthResult.userData!,
        oauthResult.identityToken!,
        oauthResult.authorizationCode || ''
      );

      if (result.success) {
        await refreshUser();
        // La redirection se fera automatiquement via useEffect quand user sera mis à jour
      } else {
        Alert.alert('Erreur', result.error?.message || 'Erreur lors de la connexion Apple');
      }
    } catch (error: any) {
      alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
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
          {/* En-tête avec Logo */}
          <View style={styles.header}>
            {/* Logo TCHINDA */}
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

            {/* Choix mode connexion */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeButton, authMode === 'password' && styles.modeButtonActive]}
                disabled={loading}
                onPress={() => {
                  setAuthMode('password');
                  setOtpSent(false);
                  setOtpCode('');
                }}
              >
                <ThemedText style={[styles.modeText, authMode === 'password' && styles.modeTextActive]}>
                  Mot de passe
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, authMode === 'otp' && styles.modeButtonActive]}
                disabled={loading}
                onPress={() => {
                  setAuthMode('otp');
                  setPassword('');
                }}
              >
                <ThemedText style={[styles.modeText, authMode === 'otp' && styles.modeTextActive]}>
                  Code email
                </ThemedText>
              </TouchableOpacity>
            </View>

            {authMode === 'password' ? (
              <>
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

            <TouchableOpacity 
              style={styles.forgotPassword} 
              disabled={loading}
              onPress={() => router.push('/ForgotPassword')}
            >
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
              </>
            ) : (
              <>
                {!otpSent ? (
                  <>
                    <ThemedText style={styles.otpHint}>
                      Connexion sans mot de passe: disponible si votre email est vérifié et que vous vous êtes déjà connecté au moins une fois.
                    </ThemedText>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        loading && styles.loginButtonDisabled,
                      ]}
                      onPress={handleRequestOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <ThemedText style={styles.loginButtonText}>
                          Envoyer le code
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <ThemedText style={styles.label}>Code reçu par email</ThemedText>
                      <TextInput
                        style={styles.input}
                        placeholder="000000"
                        placeholderTextColor="#999"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="numeric"
                        maxLength={6}
                        editable={!loading}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        loading && styles.loginButtonDisabled,
                      ]}
                      onPress={handleOtpLogin}
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

                    <TouchableOpacity
                      style={styles.forgotPassword}
                      disabled={loading}
                      onPress={handleRequestOtp}
                    >
                      <ThemedText style={styles.forgotPasswordText}>
                        Renvoyer le code
                      </ThemedText>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
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
      maxWidth: 480,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 40,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
    }),
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
  modeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#624cacff',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  modeTextActive: {
    color: '#FFFFFF',
    opacity: 1,
  },
  otpHint: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 12,
    lineHeight: 16,
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
    color: 'black',
    padding: 16,
    fontSize: 16,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      outlineWidth: 0,
      outlineStyle: 'none',
    }),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      ':hover': {
        opacity: 0.8,
      } as any,
    }),
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

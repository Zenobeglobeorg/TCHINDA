import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // État de connexion (éviter fetch externe pour ne pas déclencher CORS)
  useEffect(() => {
    setIsConnected(true);
  }, []);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      setLoadingComplete(true);
    });
  }, []);

  // Navigation après chargement complet
  useEffect(() => {
    // Nettoyer le timer précédent si on change d'état
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    // Si on est en train de charger, attendre
    if (isLoading || isConnected === null || !loadingComplete) {
      return;
    }

    // Si on a déjà navigué mais que l'utilisateur a changé (logout), réinitialiser
    if (hasNavigated.current && !isAuthenticated && !user) {
      hasNavigated.current = false;
    }

    // Naviguer seulement si on n'a pas encore navigué
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      
      // Petit délai pour une transition fluide
      navigationTimerRef.current = setTimeout(() => {
        if (isAuthenticated && user) {
          // Redirection selon le type de compte
          if (user.accountType === 'ADMIN') {
            router.replace('/admin/dashboard');
          } else if (user.accountType === 'SELLER') {
            router.replace('/seller/dashboard');
          } else if (user.accountType === 'COMMERCIAL') {
            router.replace('/commercial/dashboard');
          } else {
            // Rediriger vers l'onglet index (page d'accueil) pour les acheteurs
            router.replace('/(tabs)');
          }
        } else {
          // Rediriger vers la page de connexion
          router.replace('/Login');
        }
      }, 500);
    }

    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    };
  }, [loadingComplete, isLoading, isAuthenticated, user, isConnected, router]);

  return (
    <ThemedView style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo avec Image native */}
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.appName}>
          TCHINDA 
        </ThemedText>
      </Animated.View> 

      {/* Indicateur de chargement */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <Animated.View 
            style={[
              styles.loadingProgress,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
              },
            ]} 
          />
        </View>
        <ThemedText style={styles.loadingText}>
          {isLoading ? 'Chargement...' : isConnected === false ? 'Vérification de la connexion...' : 'Préparation...'}
        </ThemedText>
        {isConnected === false && (
          <ThemedText style={styles.connectionWarning}>
            Connexion internet requise
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1d8dafff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 90 ,
    borderColor: '#A1CEDC',
    borderWidth: 3,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold', 
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#A1CEDC',
    borderRadius: 2,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  connectionWarning: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
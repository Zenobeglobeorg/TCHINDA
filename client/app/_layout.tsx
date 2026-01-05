import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Composant interne qui utilise le thème
function AppContent() {
  const { colorScheme } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Écran de démarrage comme écran principal */}
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Accueil'
          }} 
        />
        {/* Écran de connexion */}
        <Stack.Screen 
          name="Login" 
          options={{ 
            title: 'Connexion',
            headerBackTitle: 'Retour',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
            },
            headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          }} 
        />
        {/* Écran d'inscription */}
        <Stack.Screen 
          name="SignUp" 
          options={{ 
            title: 'Inscription',
            headerBackTitle: 'Retour',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
            },
            headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          }} 
        />
        {/* Écran mot de passe oublié */}
        <Stack.Screen 
          name="ForgotPassword" 
          options={{ 
            title: 'Mot de passe oublié',
            headerBackTitle: 'Retour',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
            },
            headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          }} 
        />
        {/* Écran réinitialisation mot de passe */}
        <Stack.Screen 
          name="ResetPassword" 
          options={{ 
            title: 'Réinitialiser le mot de passe',
            headerBackTitle: 'Retour',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC',
            },
            headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          }} 
        />
        {/* Écrans tabs (si vous les utilisez après l'authentification) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Dashboard Admin */}
        <Stack.Screen 
          name="admin/dashboard" 
          options={{ 
            headerShown: false,
            title: 'Dashboard Admin'
          }} 
        />
        {/* Seller Dashboard */}
        <Stack.Screen 
          name="seller" 
          options={{ 
            headerShown: false,
            title: 'Espace Vendeur'
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

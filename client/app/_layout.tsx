import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
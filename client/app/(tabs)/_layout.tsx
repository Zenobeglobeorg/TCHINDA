import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { WebSidebar } from '@/components/WebSidebar';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Rediriger les vendeurs vers l'espace vendeur
  useEffect(() => {
    if (!isLoading && user && user.accountType === 'SELLER') {
      // Si l'utilisateur est vendeur et essaie d'accéder aux tabs acheteur, rediriger
      if (segments[0] === '(tabs)') {
        router.replace('/seller/dashboard');
      }
    }
  }, [user, isLoading, segments, router]);

  // Configuration pour mobile (tab bar en bas)
  const mobileTabConfig = {
    screenOptions: {
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarBackground: TabBarBackground,
      tabBarStyle: Platform.select({
        ios: {
          // Use a transparent background on iOS to show the blur effect
          position: 'absolute',
        },
        default: {},
      }),
    },
  };

  // Configuration pour web (sans tab bar, on utilisera la sidebar)
  const webTabConfig = {
    screenOptions: {
      tabBarStyle: { display: 'none' }, // Cacher la tab bar sur web
      headerShown: false,
    },
  };

  // Sur web, envelopper avec sidebar + contenu
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <WebSidebar />
        <View style={styles.webContent}>
          <Tabs {...webTabConfig}>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="cart"
              options={{
                title: 'Panier',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="wishlist"
              options={{
                title: 'Favoris',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="orders"
              options={{
                title: 'Commandes',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="wallet"
              options={{
                title: 'Portefeuille',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profil',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Paramètres',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
              }}
            />
          </Tabs>
        </View>
      </View>
    );
  }

  // Sur mobile, utiliser la tab bar normale
  return (
    <Tabs {...mobileTabConfig}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Portefeuille',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      minHeight: '100vh',
      width: '100%',
    }),
  },
  webContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      marginLeft: 260, // Largeur de la sidebar
      width: 'calc(100% - 260px)',
      minHeight: '100vh',
    }),
  },
});

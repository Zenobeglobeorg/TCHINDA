import { Stack, Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { WebSidebarCommercial } from '@/components/WebSidebarCommercial';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Composant interne qui utilise le contexte sidebar
function CommercialLayoutContent() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const SIDEBAR_BREAKPOINT = 768;
  const isMobile = windowWidth < SIDEBAR_BREAKPOINT;

  // Écouter les changements de taille de fenêtre
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Rediriger les non-commerciaux
  useEffect(() => {
    if (!isLoading && user && user.accountType !== 'COMMERCIAL' && user.accountType !== 'ADMIN') {
      if (segments[0] === 'commercial') {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments, router]);

  // Sur web, envelopper avec sidebar + contenu
  if (Platform.OS === 'web') {
    return (
      <SidebarProvider>
        <View style={styles.webContainer}>
          <WebSidebarCommercial />
          <View style={[styles.webContent, isMobile && styles.webContentMobile]}>
            {/* Header avec bouton hamburger sur mobile */}
            {isMobile && (
              <View style={styles.mobileHeader}>
                <HamburgerMenu />
                <Text style={styles.mobileHeaderTitle}>TCHINDA Commercial</Text>
                <View style={styles.mobileHeaderSpacer} />
              </View>
            )}
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="deposits" />
              <Stack.Screen name="withdrawals" />
              <Stack.Screen name="search" />
              <Stack.Screen name="transactions" />
              <Stack.Screen name="revenues" />
              <Stack.Screen name="support" />
              <Stack.Screen name="training" />
              <Stack.Screen name="reports" />
              <Stack.Screen name="more" />
              <Stack.Screen name="settings" />
            </Stack>
          </View>
        </View>
      </SidebarProvider>
    );
  }

  // Sur mobile natif (iOS/Android), utiliser Tabs avec barre de navigation en bas
  if (Platform.OS !== 'web') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="deposits"
          options={{
            title: 'Dépôts',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="withdrawals"
          options={{
            title: 'Retraits',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="minus" color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.left.arrow.right" color={color} />,
          }}
        />
        <Tabs.Screen
          name="revenues"
          options={{
            title: 'Revenus',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="dollarsign.circle.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Plus',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Paramètres',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          }}
        />
        {/* Écrans accessibles via navigation mais non affichés dans la barre */}
        <Tabs.Screen
          name="search"
          options={{
            href: null, // Cacher complètement de la barre
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            href: null, // Cacher complètement de la barre
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            href: null, // Cacher complètement de la barre
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            href: null, // Cacher complètement de la barre
          }}
        />
      </Tabs>
    );
  }

  // Ce code ne sera jamais atteint, mais gardé pour sécurité
  return null;
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
      marginLeft: 260,
      width: 'calc(100% - 260px)',
      minHeight: '100vh',
    }),
  },
  webContentMobile: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      marginLeft: 0,
      width: '100%',
    }),
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    }),
  },
  mobileHeaderTitle: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: Colors.light.tint,
    marginLeft: 12,
  },
  mobileHeaderSpacer: {
    flex: 1,
  },
});

export default CommercialLayoutContent;

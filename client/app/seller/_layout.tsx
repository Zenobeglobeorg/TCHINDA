import { Stack, Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { useChatUnread } from '@/contexts/ChatUnreadContext';
import { WebSidebarSeller } from '@/components/WebSidebarSeller';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

// Composant interne qui utilise le contexte sidebar
function SellerLayoutContent() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const { totalUnread } = useChatUnread();
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

  // Rediriger les non-vendeurs
  useEffect(() => {
    if (!isLoading && user && user.accountType !== 'SELLER' && user.accountType !== 'ADMIN') {
      if (segments[0] === 'seller') {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments, router]);

  // Sur web, envelopper avec sidebar + contenu
  if (Platform.OS === 'web') {
    return (
      <SidebarProvider>
        <View style={styles.webContainer}>
          <WebSidebarSeller />
          <View style={[styles.webContent, isMobile && styles.webContentMobile]}>
            {/* Header avec bouton hamburger sur mobile */}
            {isMobile && (
              <View style={styles.mobileHeader}>
                <HamburgerMenu />
                <Text style={styles.mobileHeaderTitle}>TCHINDA Vendeur</Text>
                <View style={styles.mobileHeaderSpacer} />
              </View>
            )}
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="products" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="marketing" />
              <Stack.Screen name="shop" />
              <Stack.Screen name="chat" />
              <Stack.Screen name="wallet" />
              <Stack.Screen name="sponsorship" />
              <Stack.Screen name="profile" />
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
            title: 'Tableau de bord',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Produits',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="cube.box.fill" color={color} />,
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
          name="marketing"
          options={{
            title: 'Marketing',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="megaphone.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Boutique',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="storefront.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
            tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : String(totalUnread)) : undefined,
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
          name="sponsorship"
          options={{
            title: 'Sponsorisation',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
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
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      minHeight: '100vh',
      width: '100%',
    }),
  },
  webContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
    ...(Platform.OS === 'web' && {
      // @ts-ignore
      marginLeft: 260,
      width: 'calc(100% - 260px)',
      minHeight: '100vh',
    }),
  },
  webContentMobile: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore
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
      // @ts-ignore
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

export default SellerLayoutContent;


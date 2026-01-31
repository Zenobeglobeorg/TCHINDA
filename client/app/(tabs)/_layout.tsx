import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { useChatUnread } from '@/contexts/ChatUnreadContext';
import { WebSidebar } from '@/components/WebSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';

// Composant interne qui utilise le contexte sidebar
function TabLayoutContent() {
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
      <SidebarProvider>
        <View style={styles.webContainer}>
          <WebSidebar />
          <View style={[styles.webContent, isMobile && styles.webContentMobile]}>
            {/* Header avec bouton hamburger sur mobile */}
            {isMobile && (
              <View style={styles.mobileHeader}>
                <HamburgerMenu />
                <Text style={styles.mobileHeaderTitle}>TCHINDA</Text>
                <View style={styles.mobileHeaderSpacer} />
              </View>
            )}
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
            <Tabs.Screen
              name="chat"
              options={{
                title: 'Chat',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
                tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : String(totalUnread)) : undefined,
              }}
            />
            </Tabs>
          </View>
        </View>
      </SidebarProvider>
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
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : String(totalUnread)) : undefined,
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

// Export du composant principal (le provider est déjà dans TabLayoutContent pour web)
export default TabLayoutContent;

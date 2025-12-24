import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';

export default function SellerTabLayout() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Rediriger les acheteurs vers l'espace acheteur
  useEffect(() => {
    if (!isLoading && user && user.accountType !== 'SELLER' && user.accountType !== 'ADMIN') {
      // Si l'utilisateur n'est pas vendeur et essaie d'accéder à l'espace vendeur, rediriger
      if (segments[0] === 'seller') {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
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
    </Tabs>
  );
}


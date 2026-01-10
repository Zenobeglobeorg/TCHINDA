import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  name: string;
  title: string;
  icon: string;
  route: string;
}

const navItems: NavItem[] = [
  { name: 'index', title: 'Accueil', icon: 'house.fill', route: '/index' },
  { name: 'cart', title: 'Panier', icon: 'cart.fill', route: '/cart' },
  { name: 'wishlist', title: 'Favoris', icon: 'heart.fill', route: '/wishlist' },
  { name: 'orders', title: 'Commandes', icon: 'bag.fill', route: '/orders' },
  { name: 'wallet', title: 'Portefeuille', icon: 'creditcard.fill', route: '/wallet' },
  { name: 'profile', title: 'Profil', icon: 'person.fill', route: '/profile' },
  { name: 'settings', title: 'Paramètres', icon: 'gearshape.fill', route: '/settings' },
];

export function WebSidebar() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();

  // Ne pas afficher la sidebar sur mobile
  if (Platform.OS !== 'web') {
    return null;
  }

  // Déterminer la route active à partir des segments
  const getActiveRoute = () => {
    // segments sera quelque chose comme ['(tabs)', 'index'] ou ['(tabs)', 'cart']
    if (segments.length >= 2 && segments[0] === '(tabs)') {
      return segments[1];
    }
    return 'index'; // Par défaut
  };

  const activeRoute = getActiveRoute();

  const isActive = (itemName: string) => {
    return activeRoute === itemName;
  };

  const handleNavigate = (route: string) => {
    router.push(`/(tabs)${route}` as any);
  };

  return (
    <View style={styles.sidebar}>
      {/* Logo/Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>TCHINDA</Text>
        <Text style={styles.tagline}>Marketplace</Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const active = isActive(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={item.icon as any}
                size={22}
                color={active ? Colors.light.tint : Colors.light.icon}
              />
              <Text
                style={[
                  styles.navText,
                  active && styles.navTextActive,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User Info Footer */}
      {user && (
        <View style={styles.footer}>
          <View style={styles.userInfo}>
            <IconSymbol name="person.circle.fill" size={24} color={Colors.light.icon} />
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }),
  },
  header: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: '#FAFAFA',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: Colors.light.icon,
    fontWeight: '500' as any,
  },
  navContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      overflowY: 'auto',
      flex: 1,
    }),
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    }),
  },
  navItemActive: {
    backgroundColor: Colors.light.section,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
    paddingLeft: 13, // 16 - 3 pour compenser la bordure
  },
  navText: {
    fontSize: 15,
    color: Colors.light.text,
    marginLeft: 14,
    fontWeight: '500' as any,
  },
  navTextActive: {
    color: Colors.light.tint,
    fontWeight: '600' as any,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: '#FAFAFA',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: Colors.light.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.light.icon,
  },
});

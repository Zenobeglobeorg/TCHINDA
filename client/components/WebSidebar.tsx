import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';

interface NavItem {
  name: string;
  title: string;
  icon: string;
  route: string;
}

const navItems: NavItem[] = [
  { name: 'index', title: 'Accueil', icon: 'house.fill', route: '' }, // Route vide = /(tabs) pour index
  { name: 'cart', title: 'Panier', icon: 'cart.fill', route: '/cart' },
  { name: 'wishlist', title: 'Favoris', icon: 'heart.fill', route: '/wishlist' },
  { name: 'orders', title: 'Commandes', icon: 'bag.fill', route: '/orders' },
  { name: 'wallet', title: 'Portefeuille', icon: 'creditcard.fill', route: '/wallet' },
  { name: 'profile', title: 'Profil', icon: 'person.fill', route: '/profile' },
  { name: 'settings', title: 'Paramètres', icon: 'gearshape.fill', route: '/settings' },
];

// Breakpoint pour déterminer mobile/desktop
const SIDEBAR_BREAKPOINT = 768;

export function WebSidebar() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Ne pas afficher la sidebar sur mobile native
  if (Platform.OS !== 'web') {
    return null;
  }

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

  const isMobile = windowWidth < SIDEBAR_BREAKPOINT;
  const shouldShow = isMobile ? isSidebarOpen : true;

  // Déterminer la route active à partir des segments
  const getActiveRoute = () => {
    // segments sera quelque chose comme ['(tabs)', 'index'] ou ['(tabs)', 'cart']
    // ou ['(tabs)'] pour la page index
    if (segments.length >= 2 && segments[0] === '(tabs)') {
      return segments[1];
    }
    // Si on est sur /(tabs) sans segment suivant, c'est l'index
    if (segments.length === 1 && segments[0] === '(tabs)') {
      return 'index';
    }
    return 'index'; // Par défaut
  };

  const activeRoute = getActiveRoute();

  const isActive = (itemName: string) => {
    return activeRoute === itemName;
  };

  const handleNavigate = (route: string) => {
    // Pour index (route vide), naviguer vers /(tabs) directement
    // Pour les autres routes, utiliser /(tabs)/route
    const path = route === '' ? '/(tabs)' : `/(tabs)${route}`;
    router.push(path as any);
    
    // Fermer la sidebar après navigation sur mobile
    if (isMobile) {
      // Petit délai pour laisser l'animation se faire
      setTimeout(() => closeSidebar(), 300);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <React.Fragment>
      {/* Overlay pour mobile */}
      {isMobile && isSidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeSidebar}
        />
      )}
      
      <View style={[
        styles.sidebar,
        isMobile && styles.sidebarMobile,
        isMobile && isSidebarOpen && styles.sidebarMobileOpen,
      ]}>
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
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
    }),
  },
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
      transition: 'transform 0.3s ease-in-out',
    }),
  },
  sidebarMobile: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      transform: 'translateX(-100%)',
    }),
  },
  sidebarMobileOpen: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      transform: 'translateX(0)',
      boxShadow: '2px 0 16px rgba(0, 0, 0, 0.15)',
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

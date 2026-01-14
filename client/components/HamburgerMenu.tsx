import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useSidebar } from '@/contexts/SidebarContext';

export function HamburgerMenu() {
  const { toggleSidebar } = useSidebar();

  // Ne pas afficher sur mobile native
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggleSidebar}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific styles
      cursor: 'pointer',
    }),
  },
  iconContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: Colors.light.text,
    borderRadius: 1,
  },
});

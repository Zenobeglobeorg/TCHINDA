import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LoadingViewProps {
  message?: string;
  /** Si true (par défaut), occupe tout l'écran et centre le contenu. */
  fullscreen?: boolean;
}

/**
 * Indicateur de chargement centré et animé (3 points qui rebondissent),
 * pensé pour remplacer les ActivityIndicator "nus" qui s'affichaient
 * en haut de l'écran faute de centrage sur le conteneur parent.
 */
export function LoadingView({ message, fullscreen = true }: LoadingViewProps) {
  const colors = useThemeColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(560 - delay),
        ])
      );

    const animations = [bounce(dot1, 0), bounce(dot2, 140), bounce(dot3, 280)];
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dot1, dot2, dot3]);

  const dotStyle = (value: Animated.Value) => ({
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
      { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.05] }) },
    ],
  });

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.tint }, dotStyle(dot1)]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.tint }, dotStyle(dot2)]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.tint }, dotStyle(dot3)]} />
      </View>
      {!!message && <ThemedText style={[styles.message, { color: colors.placeholder }]}>{message}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullscreen: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});

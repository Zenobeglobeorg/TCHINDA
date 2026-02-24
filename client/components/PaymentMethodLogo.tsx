import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentMethodLogoProps {
  methodId: string;
  size?: number;
}

// Mapping des images de logos
const PAYMENT_LOGO_IMAGES: Record<string, any> = {
  orange_money: require('@/assets/images/orange.png'),
  mtn_money: require('@/assets/images/mobil_money.png'),
  paypal: require('@/assets/images/paypal.png'),
  card: require('@/assets/images/visa.png'),
};

// Couleurs des marques pour les méthodes sans images
const BRAND_COLORS: Record<string, string> = {
  moov_money: '#00A651', // Moov Green
  paseecard: '#6B46C1', // Purple
  bank_transfer: '#1E40AF', // Blue
  wave: '#10B981', // Wave Green
  free_money: '#EF4444', // Free Red
};

// Icônes Material Icons pour les méthodes sans images
const PAYMENT_ICONS: Record<string, string> = {
  moov_money: 'phone-android',
  paseecard: 'credit-card',
  bank_transfer: 'account-balance',
  wave: 'account-balance-wallet',
  free_money: 'account-balance-wallet',
};

export default function PaymentMethodLogo({ methodId, size = 56 }: PaymentMethodLogoProps) {
  const logoImage = PAYMENT_LOGO_IMAGES[methodId];
  const color = BRAND_COLORS[methodId] || '#624cacff';
  const iconName = PAYMENT_ICONS[methodId] || 'credit-card';

  return (
    <View
      style={[
        styles.logoContainer,
        { width: size, height: size },
        !logoImage && { backgroundColor: color + '20' },
      ]}
    >
      {logoImage ? (
        <Image
          source={logoImage}
          style={styles.logoImage}
          resizeMode="contain"
        />
      ) : (
        <MaterialIcons
          name={iconName as any}
          size={size * 0.5}
          color={color}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});


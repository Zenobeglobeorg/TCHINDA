import { Platform, Alert as RNAlert, AccessibilityInfo } from 'react-native';
import { showCustomAlert, type AlertButton } from '@/components/ui/AlertHost';

const nativeAlert = RNAlert.alert;

const announceForAccessibility = (text?: string) => {
  if (!text || Platform.OS === 'web') {
    return;
  }

  AccessibilityInfo.announceForAccessibility(text);
};

// Accessibilité pour les écrans pas encore migrés vers alert() (voir Alert.alert direct).
if (Platform.OS !== 'web' && typeof nativeAlert === 'function') {
  RNAlert.alert = (title: string, message?: string, buttons?: any, options?: any) => {
    announceForAccessibility(`${title}${message ? `. ${message}` : ''}`);
    return nativeAlert(title, message, buttons, options);
  };
}

/**
 * Boîte de dialogue personnalisée de l'app (mêmes signature/usage que Alert.alert),
 * rendue via AlertHost (voir components/ui/AlertHost.tsx) plutôt que la boîte
 * système, pour un rendu cohérent sur web, iOS et Android.
 */
export const alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  _options?: any
) => {
  announceForAccessibility(`${title}${message ? `. ${message}` : ''}`);
  showCustomAlert(title, message, buttons);
};

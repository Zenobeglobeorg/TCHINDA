import { Platform, Alert as RNAlert } from 'react-native';

/**
 * Utilitaire d'alerte compatible avec toutes les plateformes (Web, iOS, Android)
 * Utilise window.alert sur le web et Alert.alert sur les plateformes natives
 */
export const alert = (
  title: string,
  message?: string,
  buttons?: Array<{
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>,
  options?: any
) => {
  if (Platform.OS === 'web') {
    // Sur le web, utiliser window.alert ou window.confirm
    if (buttons && buttons.length > 1) {
      // Si plusieurs boutons, utiliser confirm pour le premier bouton
      const confirmButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
      const cancelButton = buttons.find(b => b.style === 'cancel');
      
      const result = window.confirm(`${title}\n\n${message || ''}`);
      if (result && confirmButton?.onPress) {
        confirmButton.onPress();
      } else if (!result && cancelButton?.onPress) {
        cancelButton.onPress();
      }
    } else {
      // Un seul bouton, utiliser alert
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // Sur les plateformes natives, utiliser Alert.alert
    RNAlert.alert(title, message, buttons, options);
  }
};



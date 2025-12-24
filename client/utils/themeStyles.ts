import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type ColorScheme = 'light' | 'dark';

/**
 * Crée des styles qui s'adaptent au thème
 */
export function createThemedStyles(colorScheme: ColorScheme) {
  const colors = Colors[colorScheme];

  return {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,
    section: {
      backgroundColor: colors.sectionBackground,
      borderRadius: 12,
      padding: 20,
    } as ViewStyle,
    input: {
      backgroundColor: colors.input,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 8,
      color: colors.text,
    } as ViewStyle,
    text: {
      color: colors.text,
    } as TextStyle,
    textSecondary: {
      color: colors.placeholder,
    } as TextStyle,
    border: {
      borderColor: colors.border,
    } as ViewStyle,
  };
}



import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Hook pour obtenir toutes les couleurs du thème actuel
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme];
}



import { useTheme } from '@/contexts/ThemeContext';

/**
 * Hook pour obtenir le colorScheme actuel
 * Utilise le contexte de thème pour permettre le contrôle manuel
 */
export function useColorScheme(): 'light' | 'dark' {
  try {
    const { colorScheme } = useTheme();
    return colorScheme;
  } catch {
    // Fallback si le contexte n'est pas disponible
    // Cela peut arriver pendant le montage initial
    return 'light';
  }
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@tchinda_theme_mode';

// Fonction pour détecter le thème système du navigateur sur web
const getSystemColorSchemeWeb = (): 'light' | 'dark' => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return 'light';
  }

  // Détecter via media query
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [webSystemScheme, setWebSystemScheme] = useState<'light' | 'dark'>(() => 
    Platform.OS === 'web' ? getSystemColorSchemeWeb() : 'light'
  );

  // Charger la préférence sauvegardée
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Écouter les changements du thème système sur web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        setWebSystemScheme(e.matches ? 'dark' : 'light');
      };

      // Écouter les changements
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback pour les anciens navigateurs
        mediaQuery.addListener(handleChange);
      }

      // Appel initial
      handleChange(mediaQuery);

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Déterminer le colorScheme actuel
  const getColorScheme = (): 'light' | 'dark' => {
    // Si le mode est 'auto', utiliser le thème système
    if (themeMode === 'auto') {
      if (Platform.OS === 'web') {
        return webSystemScheme;
      }
      return systemColorScheme ?? 'light';
    }
    
    // Sinon, utiliser le mode choisi manuellement
    return themeMode;
  };

  const colorScheme = getColorScheme();

  const value: ThemeContextType = {
    themeMode,
    colorScheme,
    setThemeMode,
  };

  // Ne pas rendre les enfants tant que le thème n'est pas chargé
  if (isLoading) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@tchinda_theme_mode';

// NOTE: thème système désactivé pour forcer le clair par défaut.

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // const systemColorScheme = useRNColorScheme(); // (désactivé pour forcer le thème clair)
  // Par défaut: thème clair (ne suit pas le système)
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);
  // const [webSystemScheme, setWebSystemScheme] = useState<'light' | 'dark'>(() =>
  //   Platform.OS === 'web' ? getSystemColorSchemeWeb() : 'light'
  // );

  // Charger la préférence sauvegardée
  useEffect(() => {
    loadThemePreference();
  }, []);

  // (désactivé) écoute thème système web

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        // Forcer le clair par défaut: si l'utilisateur avait "auto", on le remplace par "light"
        setThemeModeState(savedTheme === 'auto' ? 'light' : (savedTheme as ThemeMode));
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
    // Si le mode est 'auto', pour l'instant on reste en clair (ne pas suivre le système)
    if (themeMode === 'auto') {
      return 'light';
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



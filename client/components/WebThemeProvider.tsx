import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Composant pour appliquer le thème choisi sur le web
 * Met à jour les styles du document selon le thème actuel
 */
export function WebThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const isDark = colorScheme === 'dark';
      
      // Supprimer les anciennes classes
      document.body.classList.remove('tchinda-light-theme', 'tchinda-dark-theme');
      document.documentElement.classList.remove('tchinda-light-theme', 'tchinda-dark-theme');
      
      // Ajouter la classe appropriée
      const themeClass = isDark ? 'tchinda-dark-theme' : 'tchinda-light-theme';
      document.body.classList.add(themeClass);
      document.documentElement.classList.add(themeClass);
      
      // Appliquer le color-scheme
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      
      // Appliquer les couleurs de fond et texte
      const bgColor = isDark ? '#121212' : '#FFFFFF';
      const textColor = isDark ? '#ECEDEE' : '#11181C';
      
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = textColor;
      
      // Créer ou mettre à jour le style dynamique
      let style = document.getElementById('tchinda-theme-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'tchinda-theme-style';
        document.head.appendChild(style);
      }
      
      // Styles pour le thème clair
      if (!isDark) {
        style.innerHTML = `
          html {
            color-scheme: light;
            background-color: #FFFFFF;
          }
          body {
            background-color: #FFFFFF;
            color: #11181C;
          }
          input, textarea, select {
            color-scheme: light;
            background-color: #FFFFFF;
            color: #11181C;
          }
        `;
      } else {
        // Styles pour le thème sombre
        style.innerHTML = `
          html {
            color-scheme: dark;
            background-color: #121212;
          }
          body {
            background-color: #121212;
            color: #ECEDEE;
          }
          input, textarea, select {
            color-scheme: dark;
            background-color: #2A2A2A;
            color: #ECEDEE;
          }
        `;
      }
      
      return () => {
        // Nettoyage minimal - on garde le style pour éviter le flash
      };
    }
  }, [colorScheme]);

  return <>{children}</>;
}

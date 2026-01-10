import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Composant pour forcer le thème clair sur le web
 * Ajoute un style global pour éviter que le navigateur impose son thème
 */
export function WebThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Forcer le thème clair sur le body
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#FFFFFF';
      document.body.style.color = '#11181C';
      
      // Ajouter une classe pour faciliter le ciblage CSS si nécessaire
      document.body.classList.add('tchinda-light-theme');
      
      // Empêcher les médias queries de changer le thème
      const style = document.createElement('style');
      style.innerHTML = `
        html {
          color-scheme: light !important;
        }
        body {
          background-color: #FFFFFF !important;
          color: #11181C !important;
        }
        @media (prefers-color-scheme: dark) {
          html, body {
            color-scheme: light !important;
            background-color: #FFFFFF !important;
            color: #11181C !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
        document.body.classList.remove('tchinda-light-theme');
      };
    }
  }, []);

  return <>{children}</>;
}

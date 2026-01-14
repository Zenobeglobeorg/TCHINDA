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
      document.documentElement.style.backgroundColor = '#FFFFFF';
      document.body.style.backgroundColor = '#FFFFFF';
      document.body.style.color = '#11181C';
      
      // Ajouter une classe pour faciliter le ciblage CSS si nécessaire
      document.body.classList.add('tchinda-light-theme');
      document.documentElement.classList.add('tchinda-light-theme');
      
      // Empêcher les médias queries de changer le thème avec un style plus robuste
      const style = document.createElement('style');
      style.id = 'tchinda-light-theme-forcer';
      style.innerHTML = `
        html {
          color-scheme: light !important;
          background-color: #FFFFFF !important;
        }
        html * {
          color-scheme: light !important;
        }
        body {
          background-color: #FFFFFF !important;
          color: #11181C !important;
        }
        @media (prefers-color-scheme: dark) {
          html, html *, body, body * {
            color-scheme: light !important;
            background-color: #FFFFFF !important;
            color: #11181C !important;
          }
        }
        /* Forcer les inputs et autres éléments */
        input, textarea, select {
          color-scheme: light !important;
          background-color: #FFFFFF !important;
          color: #11181C !important;
        }
      `;
      
      // Supprimer l'ancien style s'il existe
      const existingStyle = document.getElementById('tchinda-light-theme-forcer');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      return () => {
        const styleToRemove = document.getElementById('tchinda-light-theme-forcer');
        if (styleToRemove) {
          styleToRemove.remove();
        }
        document.body.classList.remove('tchinda-light-theme');
        document.documentElement.classList.remove('tchinda-light-theme');
      };
    }
  }, []);

  return <>{children}</>;
}

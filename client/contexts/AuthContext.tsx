import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '@/services/auth.service';
import { apiService } from '@/services/api.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  accountType: 'BUYER'; // Seul BUYER est autorisé à l'inscription
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const cachedUser = await apiService.getUser();
      
      if (cachedUser) {
        setUser(cachedUser);
        // Rafraîchir les données depuis le serveur
        await refreshUser();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Si la requête échoue, déconnecter l'utilisateur
        setUser(null);
        await authService.logout();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'utilisateur:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Erreur de connexion',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Erreur d\'inscription',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Une erreur est survenue',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Retourner des valeurs par défaut si le contexte n'est pas disponible
    // Cela peut arriver pendant le montage initial
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      login: async () => ({ success: false, error: 'AuthProvider non disponible' }),
      register: async () => ({ success: false, error: 'AuthProvider non disponible' }),
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  return context;
};



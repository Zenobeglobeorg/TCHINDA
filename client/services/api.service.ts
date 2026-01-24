import { API_CONFIG } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const STORAGE_KEYS = {
  TOKEN: '@tchinda_token',
  REFRESH_TOKEN: '@tchinda_refresh_token',
  USER: '@tchinda_user',
};

// Interface pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

// Classe de service API
class ApiService {
  private baseURL: string;
  private token: string | null = null;
  private isRefreshing: boolean = false; // Flag pour éviter les boucles infinies

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.loadToken();
  }

  // Charger le token depuis le stockage
  private async loadToken() {
    try {
      // Vérifier si on est sur le web et si window est disponible
      if (typeof window === 'undefined') {
        return; // SSR ou environnement sans window
      }
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      this.token = token;
    } catch (error) {
      // Ignorer les erreurs silencieusement en développement
      if (__DEV__) {
        console.warn('Erreur lors du chargement du token (normal en SSR):', error);
      }
    }
  }

  // Sauvegarder le token
  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  // Sauvegarder le refresh token
  async setRefreshToken(refreshToken: string | null) {
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  }

  // Sauvegarder l'utilisateur
  async setUser(user: any) {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  // Obtenir l'utilisateur sauvegardé
  async getUser() {
    try {
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  // Obtenir le refresh token
  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Erreur lors de la récupération du refresh token:', error);
      return null;
    }
  }

  // Nettoyer tous les tokens et données utilisateur
  async clearStorage() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
      this.token = null;
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage:', error);
    }
  }

  // Méthode générique pour les requêtes
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Ajouter le token d'authentification si disponible
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      // Utiliser AbortController pour le timeout (fetch n'a pas d'option timeout native)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT || 10000);

      let response: Response;
      try {
        response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            error: {
              message: 'Requête expirée. Vérifiez votre connexion internet.',
            },
          };
        }
        throw fetchError;
      }

      // Vérifier le Content-Type de la réponse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          error: {
            message: 'Réponse invalide du serveur',
          },
        };
      }

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        return {
          success: false,
          error: {
            message: 'Erreur lors du parsing de la réponse du serveur',
          },
        };
      }

      // Si le token est expiré, essayer de le rafraîchir (une seule fois)
      if (response.status === 401 && this.token && !this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Réessayer UNE SEULE FOIS avec le nouveau token
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => retryController.abort(), API_CONFIG.TIMEOUT || 10000);
            
            try {
              const retryResponse = await fetch(url, {
                ...options,
                headers: {
                  ...headers,
                  'Authorization': `Bearer ${this.token}`,
                },
                signal: retryController.signal,
              });
              clearTimeout(retryTimeoutId);
              
              const retryData = await retryResponse.json();
              
              if (retryResponse.ok) {
                return {
                  success: true,
                  data: retryData.data || retryData,
                };
              }
            } catch (retryError: any) {
              clearTimeout(retryTimeoutId);
              if (retryError.name === 'AbortError') {
                return {
                  success: false,
                  error: {
                    message: 'Requête expirée. Vérifiez votre connexion internet.',
                  },
                };
              }
            }
          }
        } finally {
          this.isRefreshing = false;
        }
        
        // Si le refresh échoue, nettoyer et retourner erreur
        await this.clearStorage();
        return {
          success: false,
          error: {
            message: 'Session expirée. Veuillez vous reconnecter.',
          },
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error?.message || 'Une erreur est survenue',
            details: data.error?.details,
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      console.error('Erreur API:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Erreur de connexion. Vérifiez votre connexion internet.',
        },
      };
    }
  }

  // Rafraîchir le token
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        // Pas de refresh token = nettoyer le stockage
        await this.clearStorage();
        return false;
      }

      // Utiliser AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT || 10000);

      let response: Response;
      try {
        response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Timeout lors du rafraîchissement du token');
        } else {
          console.error('Erreur réseau lors du rafraîchissement du token:', fetchError);
        }
        // Nettoyer le stockage en cas d'erreur
        await this.clearStorage();
        return false;
      }

      // Vérifier le Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Réponse invalide lors du rafraîchissement du token');
        await this.clearStorage();
        return false;
      }

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Erreur lors du parsing de la réponse de refresh token');
        await this.clearStorage();
        return false;
      }

      if (response.ok && data.data?.token) {
        await this.setToken(data.data.token);
        // Mettre à jour le refresh token si fourni (rotation de sécurité)
        if (data.data.refreshToken) {
          await this.setRefreshToken(data.data.refreshToken);
        }
        return true;
      }

      // Si le refresh échoue, nettoyer le stockage
      console.error('Échec du rafraîchissement du token:', data.error?.message || 'Token invalide');
      await this.clearStorage();
      return false;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      // Nettoyer le stockage en cas d'erreur
      await this.clearStorage();
      return false;
    }
  }

  // Méthodes HTTP
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Instance singleton
export const apiService = new ApiService();



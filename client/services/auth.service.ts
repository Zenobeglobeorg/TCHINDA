import { apiService } from './api.service';
import { API_CONFIG, AccountType } from '@/constants/config';

// Interfaces
export interface RegisterData {
  email: string;
  password: string;
  accountType: AccountType;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any;
  token: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  accountType: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  accountStatus: string;
  subscriptionType?: string;
  [key: string]: any;
}

// Service d'authentification
class AuthService {
  // Inscription
  async register(data: RegisterData) {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      data
    );

    if (response.success && response.data) {
      // Sauvegarder les tokens et l'utilisateur
      await apiService.setToken(response.data.token);
      await apiService.setRefreshToken(response.data.refreshToken);
      await apiService.setUser(response.data.user);
      return response;
    }

    return response;
  }

  // Connexion
  async login(data: LoginData) {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      data
    );

    if (response.success && response.data) {
      // Sauvegarder les tokens et l'utilisateur
      await apiService.setToken(response.data.token);
      await apiService.setRefreshToken(response.data.refreshToken);
      await apiService.setUser(response.data.user);
      return response;
    }

    return response;
  }

  // Déconnexion
  async logout() {
    const refreshToken = await apiService.getRefreshToken();
    
    if (refreshToken) {
      await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        refreshToken,
      });
    }

    // Nettoyer le stockage local
    await apiService.clearStorage();
  }

  // Obtenir l'utilisateur actuel
  async getCurrentUser() {
    const response = await apiService.get<any>(API_CONFIG.ENDPOINTS.AUTH.ME);

    if (response.success && response.data) {
      // Compat: ancien format { user: ... } vs nouveau format user direct
      const user = (response.data as any).user ? (response.data as any).user : response.data;
      await apiService.setUser(user);
      return { ...response, data: user as User };
    }

    // IMPORTANT: ne pas "simuler" une session avec un user en cache si on n'est pas authentifié,
    // sinon les endpoints protégés (panier/wishlist) feront 401 en boucle.
    return response as any;
  }

  // Vérifier l'email
  async verifyEmail(email: string, code: string) {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      email,
      code,
    });
  }

  // Vérifier le téléphone
  async verifyPhone(phone: string, code: string) {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_PHONE, {
      phone,
      code,
    });
  }

  // Mot de passe oublié
  async forgotPassword(email: string) {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
    });
  }

  // Réinitialiser le mot de passe
  async resetPassword(token: string, password: string) {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password,
    });
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getRefreshToken();
    return !!token;
  }

  // Connexion Google
  async loginWithGoogle(userData: any, idToken: string, accessToken: string) {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.GOOGLE,
      {
        idToken,
        accessToken,
        userData,
      }
    );

    if (response.success && response.data) {
      await apiService.setToken(response.data.token);
      await apiService.setRefreshToken(response.data.refreshToken);
      await apiService.setUser(response.data.user);
      return response;
    }

    return response;
  }

  // Connexion Facebook
  async loginWithFacebook(userData: any, accessToken: string) {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.FACEBOOK,
      {
        accessToken,
        userData,
      }
    );

    if (response.success && response.data) {
      await apiService.setToken(response.data.token);
      await apiService.setRefreshToken(response.data.refreshToken);
      await apiService.setUser(response.data.user);
      return response;
    }

    return response;
  }

  // Connexion Apple
  async loginWithApple(userData: any, identityToken: string, authorizationCode: string) {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.APPLE,
      {
        identityToken,
        authorizationCode,
        userData,
      }
    );

    if (response.success && response.data) {
      await apiService.setToken(response.data.token);
      await apiService.setRefreshToken(response.data.refreshToken);
      await apiService.setUser(response.data.user);
      return response;
    }

    return response;
  }
}

export const authService = new AuthService();



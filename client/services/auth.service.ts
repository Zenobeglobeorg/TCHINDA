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
    const response = await apiService.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME);

    if (response.success && response.data) {
      await apiService.setUser(response.data);
      return response;
    }

    // Si la requête échoue, essayer de récupérer l'utilisateur depuis le stockage
    const cachedUser = await apiService.getUser();
    if (cachedUser) {
      return {
        success: true,
        data: cachedUser,
      };
    }

    return response;
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
}

export const authService = new AuthService();



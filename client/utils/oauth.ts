import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Nécessaire pour expo-auth-session
WebBrowser.maybeCompleteAuthSession();

// Configuration des OAuth providers
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';
const APPLE_CLIENT_ID = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '';

/**
 * Connexion Google
 */
export const signInWithGoogle = async () => {
  try {
    const clientId = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('Google Client ID non configuré');
    }

    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success') {
      const { id_token } = result.params;
      
      // Récupérer les informations utilisateur depuis le token
      // Note: Dans une vraie app, vous devriez décoder le JWT côté serveur
      const userData = parseJwt(id_token);
      
      return {
        success: true,
        idToken: id_token,
        accessToken: result.params.access_token || '',
        userData: {
          email: userData.email,
          given_name: userData.given_name,
          family_name: userData.family_name,
          name: userData.name,
          picture: userData.picture,
        },
      };
    } else {
      return {
        success: false,
        error: 'Annulation de la connexion Google',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la connexion Google',
    };
  }
};

/**
 * Connexion Facebook
 */
export const signInWithFacebook = async () => {
  try {
    if (!FACEBOOK_APP_ID) {
      throw new Error('Facebook App ID non configuré');
    }

    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    const request = new AuthSession.AuthRequest({
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    });

    if (result.type === 'success') {
      const accessToken = result.params.access_token;
      
      // Récupérer les informations utilisateur
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${accessToken}`
      );
      const userData = await userInfoResponse.json();
      
      return {
        success: true,
        accessToken,
        userData: {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          name: userData.name,
          picture: userData.picture,
        },
      };
    } else {
      return {
        success: false,
        error: 'Annulation de la connexion Facebook',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la connexion Facebook',
    };
  }
};

/**
 * Connexion Apple (iOS seulement)
 */
export const signInWithApple = async () => {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Connexion Apple disponible uniquement sur iOS');
    }

    // Pour Apple, on utilise expo-apple-authentication si disponible
    // Sinon, on peut utiliser une approche web
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    if (!APPLE_CLIENT_ID) {
      throw new Error('Apple Client ID non configuré');
    }

    const request = new AuthSession.AuthRequest({
      clientId: APPLE_CLIENT_ID,
      scopes: ['name', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      additionalParameters: {
        response_mode: 'form_post',
      },
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    });

    if (result.type === 'success') {
      const { code, id_token } = result.params;
      
      let userData: any = {};
      if (id_token) {
        userData = parseJwt(id_token);
      }
      
      return {
        success: true,
        identityToken: id_token || '',
        authorizationCode: code || '',
        userData: {
          email: userData.email,
          givenName: userData.given_name || result.params.user?.given_name,
          familyName: userData.family_name || result.params.user?.family_name,
          fullName: result.params.user?.fullName?.givenName && result.params.user?.fullName?.familyName
            ? `${result.params.user.fullName.givenName} ${result.params.user.fullName.familyName}`
            : null,
        },
      };
    } else {
      return {
        success: false,
        error: 'Annulation de la connexion Apple',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la connexion Apple',
    };
  }
};

/**
 * Parse un JWT token (basique, ne vérifie pas la signature)
 */
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return {};
  }
};



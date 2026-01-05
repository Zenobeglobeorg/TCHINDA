import { findOrCreateOAuthUser } from '../services/oauth.service.js';

/**
 * Contrôleur pour la connexion Google
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token Google requis' },
      });
    }

    // Vérifier le token Google (dans un vrai projet, vous devriez utiliser google-auth-library)
    // Pour l'instant, on accepte les données utilisateur directement depuis le client
    // TODO: Implémenter la vérification du token côté serveur
    const { email, given_name, family_name, name, picture } = req.body.userData || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Données utilisateur Google incomplètes' },
      });
    }

    const result = await findOrCreateOAuthUser(
      'google',
      idToken, // Utiliser idToken comme identifiant
      email,
      {
        firstName: given_name,
        lastName: family_name,
        fullName: name,
        photo: picture,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion Google réussie',
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: error.message || 'Erreur lors de la connexion Google' },
    });
  }
};

/**
 * Contrôleur pour la connexion Facebook
 */
export const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token Facebook requis' },
      });
    }

    // Vérifier le token Facebook (dans un vrai projet, vous devriez vérifier le token)
    // Pour l'instant, on accepte les données utilisateur directement depuis le client
    const { email, first_name, last_name, name, picture } = req.body.userData || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Données utilisateur Facebook incomplètes' },
      });
    }

    const result = await findOrCreateOAuthUser(
      'facebook',
      accessToken,
      email,
      {
        firstName: first_name,
        lastName: last_name,
        fullName: name,
        photo: picture?.data?.url,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion Facebook réussie',
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: error.message || 'Erreur lors de la connexion Facebook' },
    });
  }
};

/**
 * Contrôleur pour la connexion Apple
 */
export const appleLogin = async (req, res, next) => {
  try {
    const { identityToken, authorizationCode } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token Apple requis' },
      });
    }

    // Vérifier le token Apple (dans un vrai projet, vous devriez vérifier le token JWT)
    // Pour l'instant, on accepte les données utilisateur directement depuis le client
    const { email, givenName, familyName, fullName } = req.body.userData || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Données utilisateur Apple incomplètes' },
      });
    }

    const result = await findOrCreateOAuthUser(
      'apple',
      identityToken,
      email,
      {
        firstName: givenName,
        lastName: familyName,
        fullName: fullName || (givenName && familyName ? `${givenName} ${familyName}` : null),
        photo: null, // Apple ne fournit pas de photo
      }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion Apple réussie',
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: error.message || 'Erreur lors de la connexion Apple' },
    });
  }
};



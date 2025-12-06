import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Hash un mot de passe
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare un mot de passe avec son hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Valide la force d'un mot de passe
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Le mot de passe doit contenir au moins ${minLength} caractères`,
    };
  }

  if (!hasUpperCase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une majuscule',
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une minuscule',
    };
  }

  if (!hasNumbers) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre',
    };
  }

  if (!hasSpecialChar) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un caractère spécial',
    };
  }

  return { valid: true };
};




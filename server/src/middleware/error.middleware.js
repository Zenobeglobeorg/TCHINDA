/**
 * Middleware de gestion d'erreur amélioré
 * Logging structuré et distinction entre erreurs client/serveur
 */
export const errorHandler = (err, req, res, next) => {
  // Déterminer le code de statut
  let statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';
  
  // Si c'est une erreur d'authentification, utiliser 401
  // IMPORTANT: ne pas détecter "Token" de façon trop large (ex: erreurs Prisma listant refreshTokens/passwordResetTokens)
  const jwtErrorNames = new Set(['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError']);
  const isJwtError = typeof err?.name === 'string' && jwtErrorNames.has(err.name);
  const isAuthMessage =
    typeof message === 'string' &&
    (message.includes('Email ou mot de passe incorrect') ||
      message.includes('Refresh token') ||
      message.includes('Token invalide') ||
      message.includes('Token expiré') ||
      message.includes('Authentification requise') ||
      message.includes('Non autorisé'));

  if (isJwtError || isAuthMessage) {
    statusCode = 401;
  }

  const isClientError = statusCode >= 400 && statusCode < 500;

  // Log structuré pour le monitoring
  const logData = {
    timestamp: new Date().toISOString(),
    statusCode,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
    userId: req.userId || null,
    userAgent: req.get('user-agent'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Logger différemment selon le type d'erreur
  if (isClientError) {
    // Erreurs client (4xx) - moins critiques
    console.warn('⚠️  Erreur client:', JSON.stringify(logData, null, 2));
  } else {
    // Erreurs serveur (5xx) - critiques
    console.error('❌ Erreur serveur:', JSON.stringify(logData, null, 2));
  }

  // Ne pas exposer les détails d'erreur serveur en production
  const errorResponse = {
    success: false,
    error: {
      message: isClientError ? message : 'Une erreur est survenue',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details,
        path: req.path,
      }),
    },
  };

  res.status(statusCode).json(errorResponse);
};




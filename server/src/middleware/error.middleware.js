/**
 * Middleware de gestion d'erreur amélioré
 * Logging structuré et distinction entre erreurs client/serveur
 */
export const errorHandler = (err, req, res, next) => {
  // Déterminer le code de statut
  let statusCode = err.statusCode || 500;
  
  // Si c'est une erreur d'authentification, utiliser 401
  if (err.message && (
    err.message.includes('Email ou mot de passe incorrect') ||
    err.message.includes('Token') ||
    err.message.includes('authentification') ||
    err.message.includes('Refresh token')
  )) {
    statusCode = 401;
  }

  const message = err.message || 'Erreur interne du serveur';
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




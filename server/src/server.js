import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import buyerRoutes from './routes/buyer.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import adminRoutes from './routes/admin.routes.js';
import commercialRoutes from './routes/commercial.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Import controllers (pour les routes publiques)
import { momoCallback } from './controllers/buyer.controller.js';

// Import middleware
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';
import { validateEnv } from './utils/env.validation.js';
import { prisma } from './utils/prisma.js';

// Load environment variables
dotenv.config();

// Valider les variables d'environnement critiques avant de démarrer
try {
  validateEnv();
} catch (error) {
  console.error('❌ Erreur de configuration:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANT: Railway/Render/Heroku mettent souvent un proxy devant l'app
// Nécessaire pour express-rate-limit (X-Forwarded-For) et req.ip correct
app.set('trust proxy', 1);

// Éviter les réponses 304 (ETag) sur des endpoints dynamiques (panier, wishlist, etc.)
// Sinon le client peut garder des données obsolètes et envoyer If-None-Match => 304 sans body.
app.disable('etag');

// Security middleware avec configuration améliorée
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
app.use(compression());

// Désactiver le cache côté API (données utilisateur)
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// CORS configuration
const getAllowedOrigins = () => {
  const origins = [];
  
  // Ajouter les origines depuis les variables d'environnement
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  if (process.env.MOBILE_APP_URL) {
    origins.push(process.env.MOBILE_APP_URL);
  }
  
  // Si plusieurs FRONTEND_URL sont définies (séparées par des virgules)
  if (process.env.FRONTEND_URLS) {
    origins.push(...process.env.FRONTEND_URLS.split(',').map(url => url.trim()));
  }
  
  // En développement, ajouter localhost
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:8081', 'exp://localhost:8081', 'http://localhost:3000');
  }
  
  // Si aucune origine n'est définie, utiliser localhost par défaut
  if (origins.length === 0) {
    origins.push('http://localhost:8081', 'exp://localhost:8081');
  }
  
  return origins;
};

const corsOptions = {
  origin: (origin, callback) => {
    // En production, être plus strict
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = getAllowedOrigins();
      
      // Autoriser les requêtes sans origine en production uniquement pour les applications mobiles
      // Expo Go utilise okhttp qui n'envoie pas d'en-tête Origin
      // On détecte cela via le contexte (pas d'origine) et on autorise si c'est une app mobile
      if (!origin) {
        // Autoriser les requêtes sans origine en production (applications mobiles natives)
        // C'est sécurisé car les applications mobiles ne sont pas soumises à CORS de la même manière
        // que les navigateurs web
        return callback(null, true);
      }
      
      // Vérifier strictement contre la whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Autoriser Vercel uniquement si explicitement configuré
      if (process.env.ALLOW_VERCEL_DOMAINS === 'true' && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      return callback(new Error(`Origine non autorisée: ${origin}`));
    }
    
    // En développement, être plus permissif
    // Autoriser les requêtes sans origine (ex: Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Autoriser localhost en développement
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    
    // Autoriser Vercel en développement pour les tests
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Bloquer les autres origines
    callback(new Error(`Origine non autorisée par CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // IMPORTANT (web): certains headers (ex: Cache-Control / Pragma) ne sont pas "CORS-safelisted"
  // et déclenchent un preflight OPTIONS. Il faut donc les autoriser explicitement,
  // sinon le navigateur bloque la requête ("Request header field cache-control is not allowed...").
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma'],
};
app.use(cors(corsOptions));

// Body parsing middleware avec limite par défaut plus raisonnable
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Middleware pour gérer les erreurs de taille de requête
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: { message: 'Corps de requête invalide ou trop volumineux' },
    });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { message: 'Corps de requête trop volumineux' },
    });
  }
  next(err);
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting général pour toutes les routes API
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting strict pour l'authentification (prévention brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par 15 minutes
  message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les succès
});

// Rate limiting pour refresh token
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 tentatives par 15 minutes
  message: 'Trop de tentatives de rafraîchissement de token.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le limiter général
app.use('/api/', generalLimiter);
// Note: Les limiters spécifiques (authLimiter, refreshLimiter) sont appliqués dans auth.routes.js

// Health check amélioré
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      email: 'unknown',
      sms: 'unknown',
    },
  };

  // Vérifier la base de données
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'OK';
  } catch (error) {
    health.checks.database = 'FAILED';
    health.status = 'DEGRADED';
    health.databaseError = error.message;
  }

  // Vérifier la configuration email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    health.checks.email = 'CONFIGURED';
  } else {
    health.checks.email = 'NOT_CONFIGURED';
  }

  // Vérifier la configuration SMS
  if (process.env.SMS_PROVIDER && process.env.SMS_PROVIDER !== 'test') {
    health.checks.sms = 'CONFIGURED';
  } else {
    health.checks.sms = 'NOT_CONFIGURED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Catalogue public (catégories/produits)
app.use('/api', catalogRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/commercial', commercialRoutes);
app.use('/api/chat', chatRoutes);

// Route publique MoMo callback (sans JWT - MTN appelle directement ce endpoint)
app.post('/api/payments/callback', momoCallback);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Démarrer les jobs de nettoyage automatique (optionnel, nécessite node-cron)
if (process.env.ENABLE_CLEANUP_JOBS === 'true') {
  try {
    const { startCleanupJobs } = await import('./jobs/cleanup.job.js');
    await startCleanupJobs();
  } catch (error) {
    console.warn('⚠️  Impossible de démarrer les jobs de nettoyage (node-cron peut-être non installé):', error.message);
    console.warn('   Pour activer les jobs de nettoyage, installez node-cron: npm install node-cron');
  }
}

// Créer le serveur HTTP pour Socket.IO
import { createServer } from 'http';
const httpServer = createServer(app);

// Initialiser WebSocket pour le chat
// Le chat est activé par défaut, peut être désactivé avec ENABLE_CHAT=false
const enableChat = process.env.ENABLE_CHAT !== 'false';

if (enableChat) {
  try {
    const { initializeWebSocket } = await import('./services/chat/websocket.service.js');
    const { initializePresenceService } = await import('./services/chat/presence.service.js');
    
    // Initialiser le service de présence
    await initializePresenceService();
    
    // Initialiser WebSocket
    initializeWebSocket(httpServer);
    console.log('✅ Module de chat temps réel activé');
  } catch (error) {
    console.warn('⚠️  Impossible d\'initialiser le module de chat:', error.message);
    console.warn('   Assurez-vous que socket.io est installé: npm install socket.io');
  }
}

// Start server
const serverInstance = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  if (enableChat) {
    console.log(`💬 Chat temps réel: activé`);
  }
});

export default app;




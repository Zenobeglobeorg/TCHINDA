# 🚀 Démarrage Rapide - TCHINDA Backend

## Installation en 5 minutes

### 1. Installer les dépendances
```bash
cd server
npm install
```

### 2. Configurer l'environnement
```bash
cp env.example .env
```

Éditez `.env` et configurez au minimum :
- `DATABASE_URL` (PostgreSQL local ou Supabase)
- `JWT_SECRET` (générez une clé aléatoire)
- `JWT_REFRESH_SECRET` (générez une clé aléatoire)

### 3. Initialiser la base de données
```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:push

# Créer l'admin par défaut
npm run prisma:seed
```

### 4. Démarrer le serveur
```bash
npm run dev
```

✅ Le serveur est maintenant accessible sur `http://localhost:5000`

## 📡 Endpoints Principaux

### Inscription
```bash
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "Password123!",
  "accountType": "BUYER",  // ou "SELLER", "COMMERCIAL"
  "firstName": "John",
  "lastName": "Doe",
  "country": "SN"
}
```

### Connexion
```bash
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Obtenir le profil
```bash
GET /api/auth/me
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## 🔑 Compte Admin par défaut

Après le seed :
- **Email :** admin@tchinda.com
- **Mot de passe :** Admin@1234

⚠️ **Changez ce mot de passe immédiatement !**

## 📚 Documentation Complète

- `README.md` - Documentation complète
- `SETUP.md` - Guide de configuration détaillé
- `prisma/schema.prisma` - Schéma de base de données

## 🆘 Besoin d'aide ?

Consultez `SETUP.md` pour plus de détails sur la configuration.




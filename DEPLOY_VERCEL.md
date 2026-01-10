# 🚀 Guide de Déploiement sur Vercel - TCHINDA Frontend

Ce guide explique étape par étape comment déployer le frontend TCHINDA (Expo/React Native Web) sur Vercel.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

1. ✅ Un **compte Vercel** (gratuit) : [vercel.com](https://vercel.com)
2. ✅ Un **compte GitHub** (pour connecter votre projet)
3. ✅ Votre **backend déjà déployé sur Railway** (URL : `https://tchinda-production.up.railway.app`)
4. ✅ **Git** installé sur ton PC
5. ✅ Le projet **testé localement** et fonctionnel

---

## 🎯 Vue d'ensemble : Qu'est-ce qu'on déploie ?

### Ce qu'on déploie sur Vercel
- **Le frontend uniquement** : `TCHINDA/client/` (application Expo/React Native Web)
- **Pas le backend** : Le backend reste sur Railway

### Architecture finale
```
┌─────────────────────────────────────────┐
│  UTILISATEUR (Navigateur)               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  VERCEL                                 │
│  Frontend (Expo Web)                    │
│  https://ton-app.vercel.app             │
└─────────────┬───────────────────────────┘
              │ Requêtes API
              ▼
┌─────────────────────────────────────────┐
│  RAILWAY                                │
│  Backend (Node.js + Express)            │
│  https://tchinda-production.up.railway.app│
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  SUPABASE                               │
│  Base de données (PostgreSQL)           │
└─────────────────────────────────────────┘
```

---

## 📝 Étape 1 : Préparer le projet pour Git

### 1.1 Vérifier que Git est initialisé

```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA"
git status
```

Si Git n'est pas initialisé :
```powershell
git init
```

### 1.2 Vérifier le fichier `.gitignore`

Assure-toi qu'il existe et ignore :
- `node_modules/`
- `.env`
- `.expo/`
- `dist/`
- `.output/`

---

## 📝 Étape 2 : Mettre le code sur GitHub

### 2.1 Créer un repository sur GitHub

1. Va sur [github.com](https://github.com)
2. Clique sur **"New repository"** (bouton vert en haut à droite)
3. Configure :
   - **Name** : `tchinda-market` (ou autre nom)
   - **Visibility** : `Private` (recommandé) ou `Public`
   - ❌ **NE PAS** cocher "Initialize with README"
4. Clique sur **"Create repository"**

### 2.2 Connecter ton projet local à GitHub

Dans PowerShell :

```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA"

# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Créer le premier commit
git commit -m "Initial commit - TCHINDA Market ready for Vercel"

# Connecter au repository GitHub (remplace USERNAME par ton nom d'utilisateur GitHub)
git remote add origin https://github.com/USERNAME/tchinda-market.git

# Pousser le code sur GitHub
git branch -M main
git push -u origin main
```

> ⚠️ **Si Git te demande un nom d'utilisateur et mot de passe** :
> - Utilise un **Personal Access Token** (pas ton mot de passe)
> - Va sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
> - Crée un token avec les permissions `repo`

---

## 📝 Étape 3 : Préparer la configuration pour Vercel

### 3.1 Vérifier que `vercel.json` existe

Le fichier `client/vercel.json` a été créé automatiquement. Il contient :
- La commande de build : `npm run build:web`
- Le dossier de sortie : `dist`
- Les règles de réécriture pour Expo Router

### 3.2 Vérifier `package.json`

Le script `build:web` doit être présent :
```json
"build:web": "npx expo export --platform web"
```

### 3.3 Vérifier `app.json`

La section `web` doit être présente :
```json
"web": {
  "bundler": "metro",
  "output": "static",
  "favicon": "./assets/images/favicon.png"
}
```

---

## 📝 Étape 4 : Tester le build localement (OPTIONNEL mais recommandé)

Avant de déployer sur Vercel, teste que le build fonctionne :

```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA\client"

# Installer les dépendances si pas déjà fait
npm install --legacy-peer-deps

# Faire un build de test
npm run build:web
```

Ça va créer un dossier `dist/` avec les fichiers statiques.

**Si ça fonctionne**, tu peux continuer. **Si ça plante**, envoie-moi l'erreur.

---

## 📝 Étape 5 : Déployer sur Vercel (via Interface Web)

### 5.1 Créer un projet sur Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Clique sur **"Sign Up"** (ou **"Log In"** si tu as déjà un compte)
   - Tu peux te connecter avec **GitHub** (recommandé)
3. Une fois connecté, clique sur **"Add New..."** → **"Project"**

### 5.2 Importer ton repository GitHub

1. Dans la liste des repositories, cherche `tchinda-market` (ou le nom que tu as choisi)
2. Clique sur **"Import"**

### 5.3 Configurer le projet

⚠️ **IMPORTANT** : Vercel détecte automatiquement que c'est un projet Expo, mais tu dois **corriger la configuration** :

#### Configuration du projet

1. **Root Directory** :
   - Clique sur **"Edit"** à côté de "Root Directory"
   - Sélectionne : `client`
   - ⚠️ **C'est crucial !** Sinon Vercel cherchera dans le dossier racine

2. **Framework Preset** :
   - Laisse **"Other"** ou sélectionne **"Expo"** si disponible

3. **Build Command** :
   - Vérifie que c'est : `npm run build:web`
   - Si ce n'est pas le cas, modifie-le

4. **Output Directory** :
   - Doit être : `dist`
   - Si ce champ n'existe pas, Vercel le détectera depuis `vercel.json`

5. **Install Command** :
   - Doit être : `npm install --legacy-peer-deps`
   - (Pour éviter les erreurs de peer dependencies)

### 5.4 Variables d'environnement (OPTIONNEL pour l'instant)

Pour l'instant, **tu n'as pas besoin de variables d'environnement** car :
- L'URL de l'API est déjà hardcodée dans `config.ts` pour la production
- Si tu veux la rendre configurable plus tard, tu peux ajouter une variable `NEXT_PUBLIC_API_URL` (même si ce n'est pas Next.js, Vercel l'exposera)

### 5.5 Lancer le déploiement

1. Clique sur **"Deploy"**
2. Attends 2-5 minutes que Vercel :
   - Installe les dépendances
   - Exécute `npm run build:web`
   - Déploie les fichiers statiques

### 5.6 Vérifier le déploiement

1. Une fois terminé, tu verras un message **"Congratulations!"**
2. Clique sur **"Visit"** pour voir ton app en ligne
3. L'URL sera quelque chose comme : `https://tchinda-market-xyz.vercel.app`

---

## 📝 Étape 6 : Déployer via CLI (ALTERNATIVE à l'interface web)

Si tu préfères utiliser la ligne de commande :

### 6.1 Installer Vercel CLI

```powershell
npm install -g vercel
```

### 6.2 Se connecter

```powershell
vercel login
```

### 6.3 Déployer

```powershell
cd "C:\Users\FABRICIA\Mes_projets\projet cthinda\TCHINDA\client"
vercel
```

Réponds aux questions :
- **Set up and deploy?** → `Y`
- **Which scope?** → Ton compte
- **Link to existing project?** → `N` (première fois)
- **Project name?** → `tchinda-market` (ou autre)
- **In which directory is your code located?** → `./`
- **Override settings?** → `N` (utilise vercel.json)

### 6.4 Déployer en production

```powershell
vercel --prod
```

---

## 🔧 Configuration Avancée (si nécessaire)

### Option A : Variables d'environnement sur Vercel

Si tu veux rendre l'URL de l'API configurable :

1. Dans Vercel Dashboard → Ton projet → **Settings** → **Environment Variables**
2. Ajoute :
   - **Name** : `NEXT_PUBLIC_API_URL`
   - **Value** : `https://tchinda-production.up.railway.app`
   - **Environments** : Production, Preview, Development (coche tout)

3. Modifie `client/constants/config.ts` :
```typescript
const getBaseURL = () => {
  // Utiliser la variable d'environnement si disponible (Vercel)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Sinon, logique par défaut
  const PRODUCTION_API_URL = 'https://tchinda-production.up.railway.app';
  // ... reste du code
};
```

### Option B : Domaine personnalisé

1. Dans Vercel Dashboard → Ton projet → **Settings** → **Domains**
2. Ajoute ton domaine (ex: `tchinda.com`)
3. Suis les instructions DNS (ajouter des enregistrements CNAME)

---

## ✅ Checklist de Vérification Après Déploiement

Une fois déployé, vérifie :

- [ ] L'app se charge sur l'URL Vercel (`https://ton-app.vercel.app`)
- [ ] Le splash screen s'affiche
- [ ] La page de login s'affiche
- [ ] Tu peux t'inscrire avec un nouveau compte
- [ ] Tu peux te connecter avec un compte existant
- [ ] Les appels API fonctionnent (vérifie dans la console du navigateur F12)
- [ ] La navigation fonctionne (pages, onglets, etc.)

---

## 🐛 Résolution de Problèmes

### Erreur : "Build failed" - "Command not found: expo"

**Solution** :
- Ajoute `expo` dans `dependencies` (pas `devDependencies`) dans `package.json`
- Ou modifie `build:web` : `npx expo export --platform web`

### Erreur : "Cannot find module"

**Solution** :
- Vérifie que `node_modules` n'est pas dans `.gitignore` (il doit être ignoré)
- Vérifie que `installCommand` est : `npm install --legacy-peer-deps`

### Erreur : "500 Internal Server Error" après déploiement

**Solutions** :
1. Vérifie les logs Vercel : Dashboard → Ton projet → **Deployments** → Clique sur le dernier déploiement → Voir les logs
2. Vérifie que `outputDirectory` dans `vercel.json` est `dist`
3. Vérifie que le build se termine sans erreur

### L'app charge mais les API ne fonctionnent pas

**Solutions** :
1. Ouvre la console du navigateur (F12) → Onglet **Network**
2. Vérifie que les requêtes vont vers `https://tchinda-production.up.railway.app`
3. Si les requêtes vont vers `localhost:5000`, vérifie `config.ts`
4. Vérifie les erreurs CORS dans la console

### Erreur CORS depuis Vercel vers Railway

**Solution** : Modifie le backend (Railway) pour autoriser ton domaine Vercel :
- Dans Railway Dashboard → Variables d'environnement
- Ajoute `FRONTEND_URL=https://ton-app.vercel.app`
- Redéploie le backend

---

## 📚 Documentation Complémentaire

- [Documentation Expo Web](https://docs.expo.dev/workflow/web/)
- [Documentation Vercel](https://vercel.com/docs)
- [Expo Router sur Vercel](https://docs.expo.dev/router/introduction/)

---

## 🎉 Félicitations !

Ton application TCHINDA est maintenant en ligne sur Vercel ! 🚀

Tu peux partager l'URL avec tes utilisateurs pour tester l'application.

---

## 📝 Prochaines Étapes (Optionnel)

1. **Configurer un domaine personnalisé** (ex: `app.tchinda.com`)
2. **Optimiser les performances** (cache, CDN, etc.)
3. **Activer les déploiements automatiques** (chaque push sur GitHub = nouveau déploiement)
4. **Configurer les analytics** (Vercel Analytics)


# 🔧 Résolution des Problèmes Railway

## Erreur : "npm ci" - package-lock.json manquant

### Solution 1 : Vérifier que package-lock.json est commité

Assurez-vous que `package-lock.json` est bien dans votre repository Git :

```bash
cd server
git status
# Vérifiez que package-lock.json apparaît

# Si ce n'est pas le cas, ajoutez-le :
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Solution 2 : Régénérer package-lock.json

Si le fichier est corrompu ou manquant :

```bash
cd server
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push
```

### Solution 3 : Utiliser npm install au lieu de npm ci

Railway devrait maintenant utiliser `npm install` automatiquement grâce au script `postinstall` dans `package.json`.

## Configuration Actuelle

Votre `package.json` a déjà :
- ✅ Script `postinstall` qui exécute `prisma generate`
- ✅ Script `build` qui exécute `prisma generate`

Railway exécutera automatiquement :
1. `npm install` (détection automatique)
2. `npm run postinstall` (génère Prisma Client)
3. `npm start` (démarre le serveur)

## Vérifications

1. **Vérifiez que package-lock.json est présent** :
   ```bash
   ls server/package-lock.json
   ```

2. **Vérifiez qu'il est dans Git** :
   ```bash
   git ls-files | grep package-lock.json
   ```

3. **Si vous utilisez Supabase**, assurez-vous que la variable `DATABASE_URL` est bien configurée dans Railway avec votre URL Supabase :
   ```
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

## Redéployer après correction

1. Commitez les changements
2. Push vers GitHub
3. Railway redéploiera automatiquement


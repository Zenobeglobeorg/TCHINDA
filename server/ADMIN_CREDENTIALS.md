# 🔐 Identifiants Administrateur

## Identifiants par défaut

Ces identifiants sont créés automatiquement lors de l'exécution du seed (`npm run prisma:seed`).

**⚠️ IMPORTANT : Changez ces identifiants après la première connexion !**

### Identifiants

- **Email** : `admin@tchinda.com`
- **Mot de passe** : `Admin@1234`

### Type de compte

- **Type** : `ADMIN` (Administrateur Fondateur)
- **Niveau** : 1 (Tous les droits)
- **Statut** : `ACTIVE`
- **Vérifications** : Toutes vérifiées (email, téléphone, KYC)

## Comment se connecter

1. Allez sur l'écran de connexion
2. Entrez l'email : `admin@tchinda.com`
3. Entrez le mot de passe : `Admin@1234`
4. Vous serez redirigé vers le dashboard administrateur

## Sécurité

⚠️ **Changez le mot de passe immédiatement après la première connexion !**

Pour changer le mot de passe :
1. Connectez-vous au dashboard admin
2. Allez dans les paramètres
3. Changez le mot de passe

## Créer un autre admin

Pour créer un autre administrateur, vous devez :
1. Vous connecter en tant qu'admin
2. Utiliser le panneau d'administration
3. Créer un nouvel utilisateur avec le type `ADMIN`

Ou modifier directement la base de données (non recommandé en production).


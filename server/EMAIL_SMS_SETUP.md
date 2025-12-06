# 📧 Configuration Email et SMS - TCHINDA

## ✅ Implémentation Complète

Les services d'envoi d'emails (nodemailer) et de SMS (Twilio) sont maintenant implémentés et intégrés dans le système d'authentification.

## 📧 Configuration Email (Nodemailer)

### 1. Configuration Gmail (Recommandé pour développement)

1. **Activer l'authentification à deux facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez sur [Google Account Security](https://myaccount.google.com/security)
   - Activez la validation en 2 étapes si ce n'est pas déjà fait
   - Allez dans "Mots de passe des applications"
   - Créez un nouveau mot de passe pour "Mail"
   - Copiez le mot de passe généré

3. **Configurer dans `.env`** :

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-application
EMAIL_FROM=noreply@tchinda.com
```

### 2. Configuration avec d'autres fournisseurs

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=votre-email@outlook.com
EMAIL_PASS=votre-mot-de-passe
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=votre-api-key-sendgrid
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=votre-email@mailgun.org
EMAIL_PASS=votre-mot-de-passe
```

### 3. Mode Test (Développement)

Si vous ne configurez pas les credentials email, le système fonctionnera en mode test et affichera les emails dans la console au lieu de les envoyer réellement.

## 📱 Configuration SMS (Multi-Providers)

Le système SMS supporte maintenant plusieurs providers. Voir `SMS_PROVIDERS.md` pour la documentation complète.

### Configuration Rapide

Choisissez votre provider dans `.env` :

```env
SMS_PROVIDER=test  # test, twilio, messagebird, vonage, aws-sns
```

### Configuration Twilio (Recommandé)

### 1. Créer un compte Twilio

1. Allez sur [Twilio](https://www.twilio.com/)
2. Créez un compte gratuit (inclut des crédits de test)
3. Obtenez vos credentials depuis le dashboard :
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (numéro Twilio)

### 2. Configuration dans `.env`

```env
TWILIO_ACCOUNT_SID=votre-account-sid
TWILIO_AUTH_TOKEN=votre-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Autres Providers

Consultez `SMS_PROVIDERS.md` pour la configuration de :
- MessageBird
- Vonage (ex-Nexmo)
- AWS SNS
- Mode Test (par défaut)

### 4. Mode Test (Développement)

Le mode test est activé par défaut (`SMS_PROVIDER=test`). Les SMS sont affichés dans la console sans configuration nécessaire.

## 🔧 Mise à jour de la base de données

Après avoir ajouté les nouvelles tables, exécutez :

```bash
cd server
npm run prisma:generate
npm run prisma:push
# ou
npm run prisma:migrate
```

## 📋 Fonctionnalités Implémentées

### ✅ Email

- **Envoi de codes de vérification** : Codes à 6 chiffres pour vérifier les emails
- **Email de bienvenue** : Envoyé automatiquement après l'inscription
- **Réinitialisation de mot de passe** : Email avec lien sécurisé
- **Templates HTML** : Emails stylisés et professionnels

### ✅ SMS

- **Envoi de codes de vérification** : Codes à 6 chiffres pour vérifier les téléphones
- **Notifications SMS** : Système prêt pour les notifications

### ✅ Codes de Vérification

- **Génération sécurisée** : Codes aléatoires à 6 chiffres
- **Expiration** : Codes valides pendant 10 minutes
- **Usage unique** : Chaque code ne peut être utilisé qu'une fois
- **Nettoyage automatique** : Codes expirés supprimés automatiquement

### ✅ Réinitialisation de Mot de Passe

- **Tokens sécurisés** : Tokens cryptographiques aléatoires
- **Expiration** : Tokens valides pendant 1 heure
- **Usage unique** : Chaque token ne peut être utilisé qu'une fois
- **Sécurité renforcée** : Révoque tous les tokens existants après réinitialisation

## 🚀 Utilisation

### Envoyer un code de vérification email

```bash
POST /api/auth/send-verification-email
Body: {
  "email": "user@example.com"
}
```

### Vérifier un email

```bash
POST /api/auth/verify/email
Body: {
  "email": "user@example.com",
  "code": "123456"
}
```

### Envoyer un code de vérification SMS

```bash
POST /api/auth/send-verification-sms
Body: {
  "phone": "+221771234567"
}
```

### Vérifier un téléphone

```bash
POST /api/auth/verify/phone
Body: {
  "phone": "+221771234567",
  "code": "123456"
}
```

### Demander une réinitialisation de mot de passe

```bash
POST /api/auth/forgot-password
Body: {
  "email": "user@example.com"
}
```

### Réinitialiser le mot de passe

```bash
POST /api/auth/reset-password
Body: {
  "token": "token-from-email",
  "password": "NewPassword123!"
}
```

## 🧪 Tester en Mode Développement

### Sans configuration

Si vous ne configurez pas les credentials, le système fonctionnera en mode test :

- **Emails** : Affichés dans la console du serveur
- **SMS** : Affichés dans la console du serveur

Cela permet de tester le système sans avoir besoin de configurer les services externes.

### Avec configuration

Une fois configurés, les emails et SMS seront envoyés réellement.

## 📝 Notes Importantes

1. **Sécurité** :
   - Ne commitez jamais vos credentials dans le code
   - Utilisez des variables d'environnement
   - En production, utilisez des services professionnels (SendGrid, Mailgun, etc.)

2. **Limites** :
   - Gmail : Limite de 500 emails/jour pour les comptes gratuits
   - Twilio : Limite selon votre plan (gratuit = crédits limités)

3. **Coûts** :
   - Gmail : Gratuit (avec limites)
   - Twilio : Payant après les crédits gratuits (~$0.0075/SMS)

4. **Production** :
   - Utilisez des services dédiés (SendGrid, Mailgun, AWS SES)
   - Configurez SPF et DKIM pour améliorer la délivrabilité
   - Surveillez les taux de rebond et de plainte

## 🔄 Nettoyage Automatique

Les codes et tokens expirés sont automatiquement nettoyés. Vous pouvez aussi créer un job cron pour nettoyer périodiquement :

```javascript
// À ajouter dans votre serveur
setInterval(async () => {
  await cleanExpiredCodes();
  await cleanExpiredTokens();
}, 60 * 60 * 1000); // Toutes les heures
```

## 🐛 Dépannage

### Email non reçu

1. Vérifiez les logs du serveur
2. Vérifiez le dossier spam
3. Vérifiez que les credentials sont corrects
4. Vérifiez que le port n'est pas bloqué par un firewall

### SMS non reçu

1. Vérifiez les logs du serveur
2. Vérifiez que le numéro est au format international (+221...)
3. Vérifiez que vous avez des crédits Twilio
4. Vérifiez que le numéro Twilio est correct

### Codes expirés

Les codes expirent après 10 minutes. Demandez un nouveau code si nécessaire.

## ✨ Prochaines Améliorations

- [ ] Support de plusieurs langues pour les emails/SMS
- [ ] Templates personnalisables
- [ ] Webhooks pour le suivi des emails/SMS
- [ ] Analytics des taux d'ouverture
- [ ] Support de plusieurs fournisseurs email/SMS


import nodemailer from 'nodemailer';

// Configuration du transporteur email
let transporter = null;

/**
 * Initialise le transporteur email
 */
const initTransporter = () => {
  if (transporter) return transporter;

  // En développement, utiliser un transporteur de test si les credentials ne sont pas configurés
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.warn('⚠️  Email non configuré. Utilisation du mode test.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Envoie un email
 */
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    const emailTransporter = initTransporter();

    if (!emailTransporter) {
      // En mode développement sans configuration, logger l'email
      console.log('📧 Email (mode test):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', text || html);
      return { success: true, message: 'Email envoyé (mode test)' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Version texte sans HTML
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};

/**
 * Envoie un code de vérification par email
 */
export const sendVerificationCodeEmail = async (email, code, firstName = null) => {
  const subject = 'Vérification de votre email - TCHINDA';
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #624cac;
          margin-bottom: 10px;
        }
        .code-box {
          background-color: #624cac;
          color: white;
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          letter-spacing: 5px;
          margin: 30px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .warning {
          color: #d32f2f;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TCHINDA</div>
        </div>
        <p>${greeting}</p>
        <p>Merci de vous être inscrit sur TCHINDA. Pour activer votre compte, veuillez utiliser le code de vérification suivant :</p>
        <div class="code-box">${code}</div>
        <p>Ce code est valide pendant <strong>10 minutes</strong>.</p>
        <p class="warning">⚠️ Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>&copy; ${new Date().getFullYear()} TCHINDA. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${greeting}

Merci de vous être inscrit sur TCHINDA. Pour activer votre compte, veuillez utiliser le code de vérification suivant :

${code}

Ce code est valide pendant 10 minutes.

Si vous n'avez pas demandé ce code, veuillez ignorer cet email.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} TCHINDA. Tous droits réservés.
  `;

  return await sendEmail(email, subject, html, text);
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const sendPasswordResetEmail = async (email, resetToken, firstName = null) => {
  const subject = 'Réinitialisation de votre mot de passe - TCHINDA';
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #624cac;
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          background-color: #624cac;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .warning {
          color: #d32f2f;
          font-size: 14px;
          margin-top: 20px;
        }
        .token {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          word-break: break-all;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TCHINDA</div>
        </div>
        <p>${greeting}</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <div class="token">${resetUrl}</div>
        <p>Ce lien est valide pendant <strong>1 heure</strong>.</p>
        <p class="warning">⚠️ Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe ne sera pas modifié.</p>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>&copy; ${new Date().getFullYear()} TCHINDA. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${greeting}

Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le lien suivant pour créer un nouveau mot de passe :

${resetUrl}

Ce lien est valide pendant 1 heure.

Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe ne sera pas modifié.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} TCHINDA. Tous droits réservés.
  `;

  return await sendEmail(email, subject, html, text);
};

/**
 * Envoie un email de bienvenue
 */
export const sendWelcomeEmail = async (email, firstName = null) => {
  const subject = 'Bienvenue sur TCHINDA !';
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #624cac;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TCHINDA</div>
        </div>
        <p>${greeting}</p>
        <p>Bienvenue sur TCHINDA, votre plateforme e-commerce de confiance !</p>
        <p>Votre compte a été créé avec succès. Vous pouvez maintenant commencer à explorer notre marketplace.</p>
        <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
        <p>Bonne expérience sur TCHINDA !</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
          <p>&copy; ${new Date().getFullYear()} TCHINDA. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};



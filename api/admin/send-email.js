require('dotenv').config();

const adminAuth = require('../../middleware/adminAuth');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Apply CORS headers for Vercel
  const origin = req.headers.origin;
  const allowedOrigins = process.env.NODE_ENV === 'development' 
    ? ['http://localhost:65426', 'http://localhost:3000', 'null']
    : process.env.ALLOWED_ORIGIN 
      ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
      : [process.env.ALLOWED_ORIGIN];
  
  if (allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
  }

  try {
    await adminAuth(req, res, async () => {
      const { email, subject, message } = req.body;

      // Validation des champs requis
      if (!email || !subject || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email, sujet et message sont requis.' 
        });
      }

      // Validation email simple
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Format d\'email invalide.' 
        });
      }

      // Vérification des variables d'environnement
      if (!process.env.MAILSEND || !process.env.PASSWORD) {
        return res.status(500).json({ 
          success: false, 
          error: 'Configuration email manquante.' 
        });
      }

      // Configuration du transporteur Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAILSEND,
          pass: process.env.PASSWORD
        }
      });

      // Options de l'email
      const mailOptions = {
        from: process.env.MAILSEND,
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif;margin: 0 auto;">
              <p>${message}</p>
            
            <div style="padding: 1rem 0;">
            <div style="background: var(--color-background-primary); border-radius: var(--border-radius-lg); border: 0.5px solid var(--color-border-tertiary); padding: 1.5rem; max-width: 480px;">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                <img src="https://media.licdn.com/dms/image/v2/D4D03AQFZIyvm0DipSw/profile-displayphoto-crop_800_800/B4DZiKxKRnHYAM-/0/1754674802102?e=1776297600&v=beta&t=RQpiIWCRRM-mC5mxjNM1kozfXEjk3Pzn6kZdzHZgqBU" alt="Manda Andrianina" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 0.5px solid #ddd;">
                <div>
                  <p style="font-size: 17px; font-weight: 500; margin: 0 0 4px; color: #111;">Andrianina Manda Arolala</p>
                  <p style="font-size: 13px; color: #888; margin: 0;">Développeur · Madagascar</p>
                </div>
              </div>

              <div style="border-top: 0.5px solid #e5e5e5; padding-top: 16px; display: flex; flex-direction: column; gap: 10px;">

                <a href="tel:+261333477548" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.22 6.22l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <span style="font-size: 14px;">+261 33 34 775 48</span>
                </a>

                <a href="mailto:mandaarolalaa@gmail.com" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <span style="font-size: 14px;">mandaarolalaa@gmail.com</span>
                </a>

                <a href="https://www.linkedin.com/in/andrianina-manda-arolala-150777297/" target="_blank" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  </div>
                  <span style="font-size: 14px; color: #0077b5;">LinkedIn</span>
                </a>

                <a href="https://github.com/MandaArolala3118" target="_blank" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                  </div>
                  <span style="font-size: 14px;">GitHub</span>
                </a>

              </div>
            </div>
          </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Email envoyé depuis le portfolio - ${new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        `
      };

      // Envoi de l'email
      await transporter.sendMail(mailOptions);

      console.log(`[Email] Envoyé à ${email} avec le sujet: ${subject}`);
      
      res.json({ 
        success: true, 
        message: 'Email envoyé avec succès.' 
      });
    });
  } catch (err) {
    console.error('[/api/admin/send-email]', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi de l\'email.' 
    });
  }
};

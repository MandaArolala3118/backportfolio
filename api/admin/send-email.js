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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #666; line-height: 1.6;">${message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
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

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
            <table cellpadding="0" cellspacing="0" border="0"
  style="border-collapse: collapse; font-family: Arial, sans-serif; max-width: 480px;">

  <!-- HAUT : photo + nom + titre -->
  <tr>
    <td style="padding-bottom: 16px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right: 16px; vertical-align: middle;">
            <img src="VOTRE_URL_PHOTO" width="72" height="72"
              style="border-radius: 50%; display: block;">
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">
              Andrianina Manda Arolala
            </p>
            <p style="margin: 0; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 1.2px;">
              Développeur Web
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Séparateur -->
  <tr>
    <td style="border-top: 1.5px solid #e0e0e0; padding-bottom: 14px; font-size: 0;">&nbsp;</td>
  </tr>

  <!-- BAS : contacts -->
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #444444;">
            <span style="color: #aaaaaa; font-size: 12px; margin-right: 8px;">TÉL</span>
            +261 33 34 775 48
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px;">
            <span style="color: #aaaaaa; font-size: 12px; margin-right: 8px;">EMAIL</span>
            <a href="mailto:mandaarolalaa@gmail.com"
              style="color: #D85A30; text-decoration: none;">mandaarolalaa@gmail.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px;">
            <span style="color: #aaaaaa; font-size: 12px; margin-right: 8px;">LINKEDIN</span>
            <a href="https://www.linkedin.com/in/andrianina-manda-arolala-150777297/"
              style="color: #0077b5; text-decoration: none;">andrianina-manda-arolala</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px;">
            <span style="color: #aaaaaa; font-size: 12px; margin-right: 8px;">GITHUB</span>
            <a href="https://github.com/MandaArolala3118"
              style="color: #1a1a1a; text-decoration: none;">MandaArolala3118</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
            
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

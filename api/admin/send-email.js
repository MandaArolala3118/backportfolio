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
            
            <div style="margin-top: 40px; padding: 20px; background-color: #FFBFA0; border: 2px solid #FFBFA0; border-radius: 8px; max-width: 600px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top; padding-right: 20px;">
                    <img src="https://media.licdn.com/dms/image/v2/D4D03AQFZIyvm0DipSw/profile-displayphoto-crop_800_800/B4DZiKxKRnHYAM-/0/1754674802102?e=1776297600&v=beta&t=RQpiIWCRRM-mC5mxjNM1kozfXEjk3Pzn6kZdzHZgqBU" alt="Manda Andrianina" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                  </td>
                  <td style="vertical-align: top;">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Andrianina Manda Arolala</h3>
                    <p style="margin: 5px 0; color: #333;">
                      <span style="display: inline-flex; align-items: center;">
                        <img src="https://cdn-icons-png.flaticon.com/24/724/724664.png" alt="Téléphone" style="width: 16px; height: 16px; margin-right: 5px;"> +261 33 34 775 48
                      </span><br>
                      <span style="display: inline-flex; align-items: center;">
                        <img src="https://cdn-icons-png.flaticon.com/24/561/561127.png" alt="Email" style="width: 16px; height: 16px; margin-right: 5px;"> mandaarolalaa@gmail.com
                      </span><br>
                      <a href="https://www.linkedin.com/in/andrianina-manda-arolala-150777297/" style="color: #0077b5; text-decoration: none; display: inline-flex; align-items: center;">
                        <img src="https://cdn-icons-png.flaticon.com/24/174/174857.png" alt="LinkedIn" style="width: 16px; height: 16px; margin-right: 5px;"> LinkedIn
                      </a><br>
                      <a href="https://github.com/MandaArolala3118" style="color: #333; text-decoration: none; display: inline-flex; align-items: center;">
                        <img src="https://cdn-icons-png.flaticon.com/24/25/25231.png" alt="GitHub" style="width: 16px; height: 16px; margin-right: 5px;"> GitHub
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
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

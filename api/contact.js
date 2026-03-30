require('dotenv').config();

const { contactLimiter } = require('../middleware/rateLimiter');
const { validateContact } = require('../middleware/validator');
const { insertRow } = require('../services/supabase');

module.exports = async (req, res) => {
  // Apply CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
  }

  try {
    // Apply rate limiting
    await contactLimiter(req, res, async () => {
      // Validate request body
      await validateContact(req, res, async () => {
        // Insert message into database
        await insertRow('messages', req.validatedData);
        res.status(201).json({ success: true, message: 'Message envoyé avec succès.' });
      });
    });
  } catch (err) {
    console.error('[/api/contact]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur. Réessayez plus tard.' });
  }
};

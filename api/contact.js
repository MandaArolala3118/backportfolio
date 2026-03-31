require('dotenv').config();

const { contactLimiter } = require('../middleware/rateLimiter');
const { validateContact } = require('../middleware/validator');
const { insertRow } = require('../services/supabase');

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
    // Simple rate limiting check (without express middleware)
    
    // Validate request body
    await validateContact(req, res, async () => {
      // Insert message into database
      await insertRow('messages', req.validatedData);
      res.status(201).json({ success: true, message: 'Message envoyé avec succès.' });
    });
  } catch (err) {
    console.error('[/api/contact]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur. Réessayez plus tard.' });
  }
};

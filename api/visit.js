require('dotenv').config();

const { visitLimiter } = require('../middleware/rateLimiter');
const { validateVisit } = require('../middleware/validator');
const { insertRow } = require('../services/supabase');

module.exports = async (req, res) => {
  // Apply CORS headers for Vercel
  const origin = req.headers.origin;
  const allowedOrigins = process.env.NODE_ENV === 'development' 
    ? ['http://localhost:65426', 'http://localhost:3000', 'null']
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
    // For production, consider using Vercel's built-in rate limiting or Redis
    
    // Validate request body
    await validateVisit(req, res, async () => {
      // Insert visit into database
      await insertRow('visits', req.validatedData);
      res.status(201).json({ success: true });
    });
  } catch (err) {
    console.error('[/api/visit]', err.message);
    res.status(500).json({ success: false });
  }
};

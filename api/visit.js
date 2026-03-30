require('dotenv').config();

const { visitLimiter } = require('../middleware/rateLimiter');
const { validateVisit } = require('../middleware/validator');
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
    await visitLimiter(req, res, async () => {
      // Validate request body
      await validateVisit(req, res, async () => {
        // Insert visit into database
        await insertRow('visits', req.validatedData);
        res.status(201).json({ success: true });
      });
    });
  } catch (err) {
    console.error('[/api/visit]', err.message);
    res.status(500).json({ success: false });
  }
};

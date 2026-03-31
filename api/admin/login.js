require('dotenv').config();

const { getRows } = require('../../services/supabase');

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

  const { username, password_hash } = req.body;

  if (!username || !password_hash) {
    return res.status(400).json({ success: false, error: 'Champs manquants.' });
  }

  try {
    const data = await getRows(
      'admin_users',
      `?select=id,username&username=eq.${encodeURIComponent(username)}&password_hash=eq.${encodeURIComponent(password_hash)}`
    );

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects.' });
    }

    res.json({
      success:     true,
      admin:       data[0],
      admin_token: process.env.ADMIN_TOKEN
    });
  } catch (err) {
    console.error('[/api/admin/login]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

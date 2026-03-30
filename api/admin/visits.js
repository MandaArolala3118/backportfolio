require('dotenv').config();

const adminAuth = require('../../middleware/adminAuth');
const { getRows } = require('../../services/supabase');

module.exports = async (req, res) => {
  // Apply CORS headers for Vercel
  const origin = req.headers.origin;
  const allowedOrigins = process.env.NODE_ENV === 'development' 
    ? ['http://localhost:65426', 'http://localhost:3000', 'null']
    : [process.env.ALLOWED_ORIGIN];
  
  if (allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
  }

  try {
    // Apply admin authentication
    await adminAuth(req, res, async () => {
      const data = await getRows('visits', '?select=*&order=visited_at.desc&limit=500');
      res.json({ success: true, data });
    });
  } catch (err) {
    console.error('[/api/admin/visits]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

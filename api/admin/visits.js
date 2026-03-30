require('dotenv').config();

const adminAuth = require('../../middleware/adminAuth');
const { getRows } = require('../../services/supabase');

module.exports = async (req, res) => {
  // Apply CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

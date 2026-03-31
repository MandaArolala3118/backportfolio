require('dotenv').config();

const adminAuth = require('../../middleware/adminAuth');
const { getRows, patchRow, deleteRow } = require('../../services/supabase');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Apply admin authentication for all methods
    await adminAuth(req, res, async () => {
      const { id } = req.query;

      // GET /api/admin/messages - Récupérer tous les messages
      if (req.method === 'GET') {
        const data = await getRows('messages', '?select=*&order=created_at.desc');
        return res.json({ success: true, data });
      }

      // PATCH /api/admin/messages?id=<id> - Mettre à jour un message
      if (req.method === 'PATCH') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'ID requis dans les paramètres de requête.' });
        }

        const { lu } = req.body;
        if (typeof lu !== 'boolean') {
          return res.status(400).json({ success: false, error: 'Champ "lu" (boolean) requis.' });
        }

        await patchRow('messages', `?id=eq.${id}`, { lu });
        return res.json({ success: true });
      }

      // DELETE /api/admin/messages?id=<id> - Supprimer un message
      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'ID requis dans les paramètres de requête.' });
        }

        await deleteRow('messages', `?id=eq.${id}`);
        return res.json({ success: true });
      }

      // Method not allowed
      return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
    });
  } catch (err) {
    console.error('[/api/admin/messages]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

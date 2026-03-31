require('dotenv').config();

const adminAuth = require('../../middleware/adminAuth');
const { getRows, insertRow, deleteRow } = require('../../services/supabase');

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.NODE_ENV === 'development' 
    ? ['http://localhost:65426', 'http://localhost:3000', 'null']
    : [process.env.ALLOWED_ORIGIN];
  
  if (allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await adminAuth(req, res, async () => {
      const { method } = req;

      if (method === 'GET') {
        // Lister tous les sites autorisés
        const data = await getRows('sites', '?select=*&order=created_at.desc');
        return res.json({ success: true, data });
      }

      if (method === 'POST') {
        // Ajouter un nouveau site autorisé
        const { name, domain, description } = req.body;
        
        if (!name || !domain) {
          return res.status(400).json({ 
            success: false, 
            error: 'Nom et domaine sont requis.' 
          });
        }

        await insertRow('sites', { name, domain, description });
        return res.status(201).json({ 
          success: true, 
          message: 'Site ajouté avec succès.' 
        });
      }

      if (method === 'DELETE') {
        // Supprimer un site autorisé
        const { id } = req.params;
        
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            error: 'ID du site requis.' 
          });
        }

        await deleteRow('sites', `?id=eq.${id}`);
        return res.json({ 
          success: true, 
          message: 'Site supprimé avec succès.' 
        });
      }

      return res.status(405).json({ 
        success: false, 
        error: 'Méthode non autorisée.' 
      });
    });
  } catch (err) {
    console.error('[/api/admin/sites]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

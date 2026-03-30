// middleware/adminAuth.js
// Vérifie que la requête vient bien d'un admin authentifié
// via le token passé dans le header Authorization: Bearer <ADMIN_TOKEN>

require('dotenv').config();

function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: 'Non autorisé.' });
  }

  next();
}

module.exports = adminAuth;
// routes/index.js
const express                            = require('express');
const { contactLimiter, visitLimiter }   = require('../middleware/rateLimiter');
const { validateContact, validateVisit } = require('../middleware/validator');
const adminAuth                          = require('../middleware/adminAuth');
const { insertRow, getRows, patchRow, deleteRow } = require('../services/supabase');

const router = express.Router();

// ── CORS middleware for all routes ───────────────────────────────
router.use((req, res, next) => {
  const origin = req.headers.origin;
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigins = isDev 
    ? ['http://localhost:65426', 'http://localhost:3000', 'null']
    : process.env.ALLOWED_ORIGIN 
      ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
      : [process.env.ALLOWED_ORIGIN];
  
  if (allowedOrigins.includes(origin) || (isDev && !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ══════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES (portfolio visiteur)
// ══════════════════════════════════════════════════════════════

// ── POST /api/contact ──────────────────────────────────────────
router.post('/contact', contactLimiter, validateContact, async (req, res) => {
  try {
    await insertRow('messages', req.validatedData);
    res.status(201).json({ success: true, message: 'Message envoyé avec succès.' });
  } catch (err) {
    console.error('[/api/contact]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur. Réessayez plus tard.' });
  }
});

// ── POST /api/visit ────────────────────────────────────────────
router.post('/visit', visitLimiter, validateVisit, async (req, res) => {
  try {
    await insertRow('visits', req.validatedData);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[/api/visit]', err.message);
    res.status(500).json({ success: false });
  }
});

// ══════════════════════════════════════════════════════════════
// ROUTES ADMIN (protégées par token)
// Header requis : Authorization: Bearer <ADMIN_TOKEN>
// ══════════════════════════════════════════════════════════════

// ── POST /api/admin/login ──────────────────────────────────────
// Vérifie username + password_hash dans Supabase
router.post('/admin/login', async (req, res) => {
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
      admin_token: process.env.ADMIN_TOKEN  // renvoyé au client pour les prochaines requêtes
    });
  } catch (err) {
    console.error('[/api/admin/login]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── GET /api/admin/messages ────────────────────────────────────
router.get('/admin/messages', adminAuth, async (req, res) => {
  try {
    const data = await getRows('messages', '?select=*&order=created_at.desc');
    res.json({ success: true, data });
  } catch (err) {
    console.error('[/api/admin/messages]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── GET /api/admin/visits ──────────────────────────────────────
router.get('/admin/visits', adminAuth, async (req, res) => {
  try {
    const data = await getRows('visits', '?select=*&order=visited_at.desc&limit=500');
    res.json({ success: true, data });
  } catch (err) {
    console.error('[/api/admin/visits]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── PATCH /api/admin/messages/:id ─────────────────────────────
// Body : { lu: true|false }
router.patch('/admin/messages/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { lu }  = req.body;

  if (typeof lu !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Champ "lu" (boolean) requis.' });
  }

  try {
    await patchRow('messages', `?id=eq.${id}`, { lu });
    res.json({ success: true });
  } catch (err) {
    console.error('[/api/admin/messages PATCH]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── DELETE /api/admin/messages/:id ────────────────────────────
router.delete('/admin/messages/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await deleteRow('messages', `?id=eq.${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[/api/admin/messages DELETE]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── GET /api/admin/sites ───────────────────────────────────────
// Lister les sites autorisés
router.get('/admin/sites', adminAuth, async (req, res) => {
  try {
    const data = await getRows('sites', '?select=*&order=created_at.desc');
    res.json({ success: true, data });
  } catch (err) {
    console.error('[/api/admin/sites]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── POST /api/admin/sites ──────────────────────────────────────
// Ajouter un site autorisé
router.post('/admin/sites', adminAuth, async (req, res) => {
  const { name, domain, description } = req.body;
  
  if (!name || !domain) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nom et domaine sont requis.' 
    });
  }

  try {
    await insertRow('sites', { name, domain, description });
    res.status(201).json({ 
      success: true, 
      message: 'Site ajouté avec succès.' 
    });
  } catch (err) {
    console.error('[/api/admin/sites POST]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── DELETE /api/admin/sites/:id ─────────────────────────────────
// Supprimer un site autorisé
router.delete('/admin/sites/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await deleteRow('sites', `?id=eq.${id}`);
    res.json({ success: true, message: 'Site supprimé avec succès.' });
  } catch (err) {
    console.error('[/api/admin/sites DELETE]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// ── POST /api/admin/send-email ───────────────────────────────────
// Envoyer un email (protégé par admin auth)
router.post('/admin/send-email', adminAuth, async (req, res) => {
  const { email, subject, message } = req.body;

  // Validation des champs requis
  if (!email || !subject || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email, sujet et message sont requis.' 
    });
  }

  // Validation email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Format d\'email invalide.' 
    });
  }

  try {
    const nodemailer = require('nodemailer');

    // Vérification des variables d'environnement
    if (!process.env.MAILSEND || !process.env.PASSWORD) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuration email manquante.' 
      });
    }

    // Configuration du transporteur Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAILSEND,
        pass: process.env.PASSWORD
      }
    });

    // Options de l'email
    const mailOptions = {
      from: process.env.MAILSEND,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Email envoyé depuis le portfolio - ${new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      `
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    console.log(`[Email] Envoyé à ${email} avec le sujet: ${subject}`);
    
    res.json({ 
      success: true, 
      message: 'Email envoyé avec succès.' 
    });
  } catch (err) {
    console.error('[/api/admin/send-email]', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi de l\'email.' 
    });
  }
});

module.exports = router;
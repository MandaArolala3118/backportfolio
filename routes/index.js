// routes/index.js
const express                            = require('express');
const { contactLimiter, visitLimiter }   = require('../middleware/rateLimiter');
const { validateContact, validateVisit } = require('../middleware/validator');
const adminAuth                          = require('../middleware/adminAuth');
const { insertRow, getRows, patchRow, deleteRow } = require('../services/supabase');

const router = express.Router();

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

module.exports = router;
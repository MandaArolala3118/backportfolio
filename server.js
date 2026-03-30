// server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes/index');

const app    = express();
const PORT   = process.env.PORT || 3000;
const isDev  = process.env.NODE_ENV === 'development';

// ── CORS ───────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    if (isDev) {
      // Dev : tout autoriser (null, localhost, fichier local)
      return callback(null, true);
    }
    // Prod : seulement le domaine déclaré dans .env
    if (origin === process.env.ALLOWED_ORIGIN) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Répondre aux preflight OPTIONS

// ── Body parser ────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api', routes);

// ── Route inconnue ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable.' });
});

// ── Erreurs globales ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Erreur globale]', err.message);
  res.status(500).json({ success: false, error: 'Erreur serveur interne.' });
});

// ── Démarrage ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Serveur démarré en mode ${isDev ? 'DÉVELOPPEMENT' : 'PRODUCTION'} sur http://localhost:${PORT}`);
});
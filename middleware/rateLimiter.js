// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Limiteur pour le formulaire de contact
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,                    // 3 messages max par IP par heure
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de messages envoyés. Réessayez dans une heure.'
  }
});

// Limiteur pour le tracking des visites
const visitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 requêtes max par IP par minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de requêtes.'
  }
});

module.exports = { contactLimiter, visitLimiter };
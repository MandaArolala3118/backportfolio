// middleware/validator.js

function validateContact(req, res, next) {
  const { nom, email, sujet, message } = req.body;
  const errors = [];

  if (!nom || typeof nom !== 'string' || nom.trim().length < 2) {
    errors.push('Le nom doit contenir entre 2 et 100 caractères.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('Adresse email invalide.');
  }

  if (!sujet || typeof sujet !== 'string' || sujet.trim().length < 2 || sujet.trim().length > 150) {
    errors.push('Le sujet doit contenir entre 2 et 150 caractères.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 2000) {
    errors.push('Le message doit contenir entre 10 et 2000 caractères.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Nettoyer les données avant de les passer à la suite
  req.validatedData = {
    nom:     nom.trim(),
    email:   email.trim().toLowerCase(),
    sujet:   sujet.trim(),
    message: message.trim()
  };

  next();
}

function validateVisit(req, res, next) {
  const { page, referrer, user_agent } = req.body;

  req.validatedData = {
    page:       typeof page === 'string'       ? page.slice(0, 255)       : '/',
    referrer:   typeof referrer === 'string'   ? referrer.slice(0, 255)   : null,
    user_agent: typeof user_agent === 'string' ? user_agent.slice(0, 500) : null,
  };

  next();
}

module.exports = { validateContact, validateVisit };
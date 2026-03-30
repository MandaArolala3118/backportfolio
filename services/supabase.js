// services/supabase.js
require('dotenv').config();

const https = require('https');

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY   = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const isDev               = process.env.NODE_ENV === 'development';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('[supabase] SUPABASE_URL ou SUPABASE_ANON_KEY manquant dans le .env');
}

console.log('[supabase] URL configurée :', SUPABASE_URL);

// En dev : ignore les certificats SSL (proxy/antivirus)
// En prod : vérification SSL stricte
const agent = new https.Agent({ rejectUnauthorized: !isDev });

// ── Requête générique ──────────────────────────────────────────
function sbRequest({ method, path, body, useSecret = false, extraHeaders = {} }) {
  return new Promise((resolve, reject) => {
    const key     = useSecret ? SUPABASE_SECRET_KEY : SUPABASE_ANON_KEY;
    const urlObj  = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
    const payload = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      ...extraHeaders
    };
    if (payload) reqHeaders['Content-Length'] = Buffer.byteLength(payload);

    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + (urlObj.search || ''),
      method,
      headers:  reqHeaders,
      agent
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { return resolve(raw ? JSON.parse(raw) : null); } catch { return resolve(null); }
        }
        let parsed = {};
        try { parsed = JSON.parse(raw); } catch {}
        reject(new Error(`[${res.statusCode}] ${parsed.message || parsed.hint || raw}`));
      });
    });

    req.on('error', (err) => reject(new Error(`Erreur réseau : ${err.message}`)));
    if (payload) req.write(payload);
    req.end();
  });
}

// ── API publique ───────────────────────────────────────────────

function insertRow(table, data) {
  return sbRequest({
    method: 'POST',
    path:   table,
    body:   data,
    extraHeaders: { 'Prefer': 'return=minimal' }
  });
}

// ── API admin (utilise la service role key) ────────────────────

function getRows(table, query = '') {
  return sbRequest({
    method:     'GET',
    path:       `${table}${query}`,
    useSecret:  true
  });
}

function patchRow(table, query, data) {
  return sbRequest({
    method:     'PATCH',
    path:       `${table}${query}`,
    body:       data,
    useSecret:  true,
    extraHeaders: { 'Prefer': 'return=minimal' }
  });
}

function deleteRow(table, query) {
  return sbRequest({
    method:    'DELETE',
    path:      `${table}${query}`,
    useSecret: true
  });
}

module.exports = { insertRow, getRows, patchRow, deleteRow };
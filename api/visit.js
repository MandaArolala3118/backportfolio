module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;

  console.log('METHOD:', req.method);
  console.log('origin reçu:', origin);
  console.log('ALLOWED_ORIGIN env:', allowedOrigin);
  console.log('match:', origin === allowedOrigin);

  res.setHeader('Access-Control-Allow-Origin', 'https://portfolio-green-psi-38.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({ ok: true });
};
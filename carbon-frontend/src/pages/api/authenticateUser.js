// middleware/authenticateUser.js
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Cek ke Supabase apakah token valid
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn('🔒 Invalid token:', error?.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // 2. Decode token & cek expiry time secara manual (opsional tapi disarankan)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(401).json({ error: 'Unauthorized: Token malformed' });
    }

    const now = Math.floor(Date.now() / 1000); // Waktu sekarang (dalam detik)
    if (decoded.exp < now) {
      console.warn('🔒 Token expired at', new Date(decoded.exp * 1000).toISOString());
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }

    req.user = data.user; // user info bisa digunakan di handler
    next();
  } catch (err) {
    console.error('❌ Error during auth middleware:', err);
    return res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}

export default authenticateUser;

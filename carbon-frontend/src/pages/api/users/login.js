// pages/api/users/login.js
import { createClient } from '@supabase/supabase-js';

// Make sure these values are defined in .env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      console.warn(`Login attempt failed for ${username}:`, error.message);
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: data.session.access_token,
      userId: data.user.id,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
}

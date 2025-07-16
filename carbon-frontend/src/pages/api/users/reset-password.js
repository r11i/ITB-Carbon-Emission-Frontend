// pages/api/users/reset-password.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { password, access_token, refresh_token } = req.body;

  if (!password || !access_token || !refresh_token) {
    return res.status(400).json({ error: 'Missing password or token(s).' });
  }

  try {
    // Set session using tokens
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

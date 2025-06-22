// pages/api/users/register.js
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

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (listError) {
      console.error("Supabase listUsers error:", listError.message);
      return res.status(500).json({ error: "Failed to verify user existence." });
    }

    const userExists = existingUsers?.users.some((u) => u.email === username);
    if (userExists) {
      return res.status(400).json({ error: "Email already in use. Please login instead." });
    }

    // Register new user
    const { error: signUpError } = await supabase.auth.signUp({ email: username, password });

    if (signUpError) {
      console.error("Supabase signUp error:", signUpError.message);
      return res.status(400).json({ error: signUpError.message });
    }

    res.status(201).json({ message: "Registration successful. Please check your email for verification." });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "An unexpected error occurred during registration." });
  }
}

import { createClient } from '@supabase/supabase-js';

// Use Service Role Key — NEVER expose this to the frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // must be server-side only
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Step 1: Check if email already registered
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError.message);
      return res.status(500).json({ error: "Could not check existing users." });
    }

    const userExists = users?.users?.find((u) => u.email === username);
    if (userExists) {
      return res.status(400).json({ error: "Email already in use. Please login instead." });
    }

    // Step 2: Register new user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: username,
      password,
    });

    if (signUpError) {
      console.error("Supabase signUp error:", signUpError.message);
      return res.status(400).json({ error: signUpError.message });
    }

    return res.status(201).json({
      message: "Registration successful. Please check your email for verification.",
    });
  } catch (err) {
    console.error("Registration failed:", err);
    return res.status(500).json({ error: "Unexpected error occurred." });
  }
}

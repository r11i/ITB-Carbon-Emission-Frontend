// pages/api/users/register.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: username,
      password: password,
    });

    if (error) {
      console.error("🔒 Supabase signUp error:", error.message);

      let friendlyError = error.message;
      if (
        friendlyError.toLowerCase().includes("user already registered") ||
        friendlyError.toLowerCase().includes("duplicate")
      ) {
        friendlyError = "Email already in use. Please login instead.";
      }

      return res.status(400).json({ error: friendlyError });
    }

    return res.status(201).json({
      message: "✅ Registration successful. Please verify your email.",
      user: data.user,
    });
  } catch (err) {
    console.error("❌ Registration server error:", err.message);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}

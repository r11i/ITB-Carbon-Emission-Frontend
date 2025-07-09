import { createClient } from "@supabase/supabase-js";

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { usage_id } = req.body;

  // Input validation
  if (!usage_id) {
    return res.status(400).json({ error: "usage_id is required." });
  }

  try {
    const { data, error } = await supabase
      .from("Device_usage")
      .delete()
      .eq("usage_id", usage_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "✅ Device usage deleted successfully.",
      deleted_usage: data,
    });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res
      .status(500)
      .json({ error: `Failed to delete device usage: ${err.message}` });
  }
}

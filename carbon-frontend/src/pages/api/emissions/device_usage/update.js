import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { usage_id, device_id, year, month, usage_hours } = req.body;

  // Validation
  if (!usage_id || !device_id || !year || !month || usage_hours == null) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (isNaN(parseInt(usage_hours)) || parseInt(usage_hours) < 0) {
    return res
      .status(400)
      .json({ error: "usage_hours must be a non-negative number." });
  }

  if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || month < 1 || month > 12) {
    return res.status(400).json({ error: "Invalid year or month." });
  }

  try {
    const { data, error } = await supabase
      .from("Device_usage")
      .update({
        device_id: parseInt(device_id),
        year: parseInt(year),
        month: parseInt(month),
        usage_hours: parseInt(usage_hours),
      })
      .eq("usage_id", usage_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "✅ Device usage updated successfully.",
      updated_usage: data,
    });
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res
      .status(500)
      .json({ error: `Failed to update device usage: ${err.message}` });
  }
}

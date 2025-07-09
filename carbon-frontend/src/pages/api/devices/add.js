import { createClient } from "@supabase/supabase-js";

// Setup Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { device_name, device_power, room_id } = req.body;

  // Validate input
  if (!device_name || !device_power || !room_id) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (isNaN(device_power) || device_power <= 0) {
    return res
      .status(400)
      .json({ error: "device_power must be a positive number." });
  }

  try {
    const { data, error } = await supabase
      .from("Devices")
      .insert([
        {
          device_name,
          device_power: parseInt(device_power),
          room_id: parseInt(room_id),
        },
      ])
      .select("device_id, device_name, device_power, room_id")
      .single();

    if (error) {
      console.error("❌ Error inserting device:", error.message);
      return res.status(500).json({ error: "Failed to add device." });
    }

    return res.status(201).json({
      message: "✅ Device added successfully.",
      device: data,
    });
  } catch (err) {
    console.error("❌ Server error:", err.message);
    return res
      .status(500)
      .json({ error: "Server error while adding device." });
  }
}

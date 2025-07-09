import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using env variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { device_id } = req.query;

  if (!device_id) {
    return res
      .status(400)
      .json({ error: "device_id is required as query parameter." });
  }

  try {
    const { data, error } = await supabase
      .from("Device_usage")
      .select("*")
      .eq("device_id", device_id)
      .order("year", { ascending: true })
      .order("month", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      device_id,
      usage_records: data,
    });
  } catch (err) {
    console.error("❌ Error fetching device usage:", err.message);
    res
      .status(500)
      .json({ error: `Failed to fetch device usage: ${err.message}` });
  }
}

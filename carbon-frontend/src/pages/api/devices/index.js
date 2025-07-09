import { createClient } from "@supabase/supabase-js";

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { room_name, building_name } = req.query;

  if (!room_name || !building_name) {
    return res
      .status(400)
      .json({ error: "Both room_name and building_name are required." });
  }

  try {
    // 1. Get building_id
    const { data: buildingData, error: buildingError } = await supabase
      .from("Buildings")
      .select("building_id")
      .eq("building_name", building_name)
      .maybeSingle();

    if (buildingError) throw new Error(`Finding building: ${buildingError.message}`);
    if (!buildingData) {
      return res.status(404).json({ error: "Building not found." });
    }

    // 2. Get room_id
    const { data: roomData, error: roomError } = await supabase
      .from("Rooms")
      .select("room_id")
      .eq("room_name", room_name)
      .eq("building_id", buildingData.building_id)
      .maybeSingle();

    if (roomError) throw new Error(`Finding room: ${roomError.message}`);
    if (!roomData) {
      return res.status(404).json({ error: "Room not found in the specified building." });
    }

    // 3. Get devices in the room
    const { data: devices, error: devicesError } = await supabase
      .from("Devices")
      .select("device_id, device_name, device_power")
      .eq("room_id", roomData.room_id);

    if (devicesError) throw new Error(`Fetching devices: ${devicesError.message}`);

    res.status(200).json({
      building_name,
      room_name,
      devices,
    });

  } catch (err) {
    console.error("Error fetching devices by room and building:", err.message);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}

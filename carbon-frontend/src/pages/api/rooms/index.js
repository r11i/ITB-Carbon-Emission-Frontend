import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { building_name } = req.query;

  if (!building_name) {
    return res.status(200).json({ rooms: [] }); // For dependent dropdown fallback
  }

  try {
    // Find building_id first
    const { data: buildingData, error: buildingError } = await supabase
      .from('Buildings')
      .select('building_id')
      .eq('building_name', building_name)
      .maybeSingle();

    if (buildingError) throw new Error(`Finding building ID: ${buildingError.message}`);
    if (!buildingData) return res.status(200).json({ rooms: [] });

    // Fetch rooms for the building
    const { data: roomData, error: roomError } = await supabase
      .from('Rooms')
      .select('room_id, room_name')
      .eq('building_id', buildingData.building_id);

    if (roomError) throw new Error(`Fetching rooms: ${roomError.message}`);

    const rooms = roomData
      ? roomData
          .map((r) => ({ room_name: r.room_name, room_id: r.room_id }))
          .sort((a, b) => a.room_name.localeCompare(b.room_name))
      : [];

    return res.status(200).json({ rooms });
  } catch (err) {
    console.error(`❌ Server error fetching rooms for ${building_name}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}

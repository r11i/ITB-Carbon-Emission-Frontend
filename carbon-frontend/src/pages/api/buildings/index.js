// pages/api/buildings/index.js
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

  const { campus_name } = req.query;

  if (!campus_name) {
    return res.status(200).json({ buildings: [] }); // Important for dependent dropdowns
  }

  try {
    const { data: campusData, error: campusError } = await supabase
      .from('Campuses')
      .select('campus_id')
      .eq('campus_name', campus_name)
      .maybeSingle();

    if (campusError) throw new Error(`Finding campus ID: ${campusError.message}`);
    if (!campusData) return res.status(200).json({ buildings: [] });

    const { data: buildingData, error: buildingError } = await supabase
      .from('Buildings')
      .select('building_name')
      .eq('campus_id', campusData.campus_id);

    if (buildingError) throw new Error(`Fetching buildings: ${buildingError.message}`);

    const buildingNames = buildingData
      ? buildingData.map((b) => b.building_name).sort((a, b) => a.localeCompare(b))
      : [];

    res.status(200).json({ buildings: buildingNames });
  } catch (err) {
    console.error(`Server error fetching buildings for ${campus_name}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}

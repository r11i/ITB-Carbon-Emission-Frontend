// pages/api/emissions/building.js
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

  let { campus = 'All', year = 'All' } = req.query;

  try {
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let done = false;
    let allData = [];

    // Paginate Supabase query
    while (!done) {
      let query = supabase
        .from('aggregated_emissions_by_building_and_room')
        .select('*')
        .range(from, to);

      if (campus !== 'All') query = query.eq('campus_name', campus);
      if (year !== 'All') query = query.eq('year', parseInt(year));

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;

      allData = allData.concat(data);

      if (data.length < pageSize) {
        done = true;
      } else {
        from += pageSize;
        to += pageSize;
      }
    }

    // Group emissions by building and room
    const emissionsByBuilding = {};

    allData.forEach((row) => {
      const { building_name, room_name, emission } = row;

      if (!building_name || !room_name || emission == null) {
        console.warn('Skipping incomplete data:', row);
        return;
      }

      if (!emissionsByBuilding[building_name]) {
        emissionsByBuilding[building_name] = {
          total_emission: 0,
          rooms: {},
        };
      }

      emissionsByBuilding[building_name].total_emission += emission;
      emissionsByBuilding[building_name].rooms[room_name] =
        (emissionsByBuilding[building_name].rooms[room_name] || 0) + emission;
    });

    // Round to 3 decimal places
    for (const building in emissionsByBuilding) {
      emissionsByBuilding[building].total_emission = parseFloat(
        emissionsByBuilding[building].total_emission.toFixed(3)
      );
      for (const room in emissionsByBuilding[building].rooms) {
        emissionsByBuilding[building].rooms[room] = parseFloat(
          emissionsByBuilding[building].rooms[room].toFixed(3)
        );
      }
    }

    res.status(200).json({
      filter: { campus, year },
      buildings: emissionsByBuilding,
    });
  } catch (err) {
    console.error('Server error fetching building emissions:', err.message);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

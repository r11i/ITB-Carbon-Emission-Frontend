// pages/api/emissions/device.js
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

  const { campus = 'All', year = 'All' } = req.query;

  try {
    let query = supabase.from('aggregated_emissions_by_device').select('*');

    if (campus !== 'All') query = query.eq('campus_name', campus);
    if (year !== 'All') query = query.eq('year', parseInt(year));

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const emissionsByDeviceName = {};

    data.forEach((row) => {
      const { device_name, total_emission } = row;

      if (!device_name || total_emission == null) {
        console.warn('Skipping invalid row:', row);
        return;
      }

      emissionsByDeviceName[device_name] =
        (emissionsByDeviceName[device_name] || 0) + parseFloat(total_emission);
    });

    // Round results
    for (const device in emissionsByDeviceName) {
      emissionsByDeviceName[device] = parseFloat(emissionsByDeviceName[device].toFixed(3));
    }

    res.status(200).json({
      filter: { campus, year },
      device_emissions: emissionsByDeviceName,
    });
  } catch (err) {
    console.error('Server error fetching device emissions:', err.message);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

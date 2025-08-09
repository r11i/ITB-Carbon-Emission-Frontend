// pages/api/emissions/campus.js
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
    // Query view
    let query = supabase.from('aggregated_emissions_by_campus').select('*');

    if (campus !== 'All') query = query.eq('campus_name', campus);
    if (year !== 'All') query = query.eq('year', parseInt(year));

    const { data: aggregatedData, error } = await query;

    if (error) throw new Error(error.message);

    // Aggregate results
    const emissionsByCampus = {};
    const totalEmissionsByCampus = {};

    aggregatedData.forEach((row) => {
      const campusName = row.campus_name;
      const yearKey = row.year;
      const monthKey = row.month;
      const emission = parseFloat(row.emission);

      if (!emissionsByCampus[campusName]) {
        emissionsByCampus[campusName] = {};
        totalEmissionsByCampus[campusName] = 0;
      }

      totalEmissionsByCampus[campusName] += emission;

      let aggregationKey;
      if (year !== 'All' && campus !== 'All') aggregationKey = monthKey;
      else if (year !== 'All' && campus === 'All') aggregationKey = monthKey;
      else aggregationKey = yearKey;

      emissionsByCampus[campusName][aggregationKey] =
        (emissionsByCampus[campusName][aggregationKey] || 0) + emission;
    });

    // Round to 3 decimal places
    for (const camp in totalEmissionsByCampus) {
      totalEmissionsByCampus[camp] = parseFloat(totalEmissionsByCampus[camp].toFixed(3));
    }

    for (const camp in emissionsByCampus) {
      for (const key in emissionsByCampus[camp]) {
        emissionsByCampus[camp][key] = parseFloat(emissionsByCampus[camp][key].toFixed(3));
      }
    }

    res.status(200).json({
      filter: { campus, year },
      emissions: emissionsByCampus,
      total_emissions: totalEmissionsByCampus,
    });
  } catch (err) {
    console.error('Server error fetching campus emissions:', err.message);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

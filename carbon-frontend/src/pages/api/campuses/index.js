// pages/api/campuses/index.js
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

  try {
    const { data, error } = await supabase.from('Campuses').select('campus_name');

    if (error) throw error;

    const sortedCampuses = data
      ? data.sort((a, b) => a.campus_name.localeCompare(b.campus_name))
      : [];

    res.status(200).json({ campuses: sortedCampuses });
  } catch (err) {
    console.error('Server error fetching campuses:', err.message);
    res.status(500).json({ error: `Database error: ${err.message}` });
  }
}

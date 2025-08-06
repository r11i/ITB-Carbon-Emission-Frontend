// /pages/api/device-usages/[usage_id].js
import { createClient } from '@supabase/supabase-js';
import authenticateUser from '../authenticateUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  const { usage_id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return authenticateUser(req, res, () => deleteHandler(req, res, usage_id));
}

async function deleteHandler(req, res, usage_id) {
  if (!usage_id) {
    return res.status(400).json({ error: 'usage_id is required in the URL.' });
  }

  try {
    const { data, error } = await supabase
      .from('Device_usage')
      .delete()
      .eq('usage_id', usage_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: '✅ Device usage deleted successfully.',
      deleted_usage: data,
    });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ error: `Failed to delete device usage: ${err.message}` });
  }
}

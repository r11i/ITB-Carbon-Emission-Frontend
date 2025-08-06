// pages/api/devices/[device_id].js
import { createClient } from '@supabase/supabase-js';
import authenticateUser from '../authenticateUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  const { method } = req;
  const { device_id } = req.query;

  if (method === 'DELETE') {
    return authenticateUser(req, res, () => handleDeleteDevice(req, res, device_id));
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}

async function handleDeleteDevice(req, res, device_id) {
  if (!device_id) {
    return res.status(400).json({ error: 'Device ID is required in the URL.' });
  }

  try {
    const { data: existingDevice, error: fetchError } = await supabase
      .from('Devices')
      .select('*')
      .eq('device_id', device_id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existingDevice) return res.status(404).json({ error: 'Device not found.' });

    const { error: deleteError } = await supabase
      .from('Devices')
      .delete()
      .eq('device_id', device_id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      message: 'Device deleted successfully.',
      deleted_device_id: device_id,
    });
  } catch (err) {
    console.error('Delete device error:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
}

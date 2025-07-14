// src/pages/api/device-usages/index.js
import { createClient } from '@supabase/supabase-js';
import authenticateUser from '../authenticateUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return authenticateUser(req, res, () => postHandler(req, res));
  } else if (req.method === 'GET') {
    return getHandler(req, res);
  } else if (req.method === 'PUT') {
    return authenticateUser(req, res, () => putHandler(req, res));
  } else if (req.method === 'DELETE') {
    return authenticateUser(req, res, () => deleteHandler(req, res));
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function postHandler(req, res) {
  const {
    device_id,
    device_name,
    device_power,
    campus_name,
    building_name,
    room_name,
    usage_hours,
    year,
    month,
  } = req.body;

  if (
    !device_name ||
    !device_power ||
    !campus_name ||
    !building_name ||
    !room_name ||
    usage_hours == null ||
    !year ||
    !month
  ) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (isNaN(+device_power) || +device_power <= 0) {
    return res.status(400).json({ error: 'device_power must be a positive number.' });
  }

  if (isNaN(+usage_hours) || +usage_hours < 0) {
    return res.status(400).json({ error: 'usage_hours must be a non-negative number.' });
  }

  if (isNaN(+year) || isNaN(+month) || +month < 1 || +month > 12) {
    return res.status(400).json({ error: 'Invalid year or month.' });
  }

  try {
    const { data: existingData, error: checkError } = await supabase
      .from('Device_usage')
      .select('usage_id')
      .eq('device_id', device_id)
      .eq('year', +year)
      .eq('month', +month)
      .maybeSingle();

    if (checkError) throw new Error(`Checking existing data: ${checkError.message}`);

    if (existingData) {
      return res.status(409).json({
        error: 'Data untuk device tersebut pada bulan dan tahun yang sama sudah ada.',
      });
    }

    const { data: usageData, error: usageError } = await supabase
      .from('Device_usage')
      .insert([
        {
          device_id,
          usage_hours: +usage_hours,
          year: +year,
          month: +month,
        },
      ])
      .select()
      .single();

    if (usageError) throw new Error(`Inserting device usage: ${usageError.message}`);

    res.status(201).json({
      message: '✅ Device and usage data saved successfully!',
      usage: usageData,
    });
  } catch (err) {
    console.error('❌ Error processing device input:', err.message);
    res.status(500).json({ error: `Failed to save data: ${err.message}` });
  }
}

async function getHandler(req, res) {
  const { device_id } = req.query;
  if (!device_id) {
    return res.status(400).json({ error: 'device_id is required as query parameter.' });
  }

  try {
    const { data, error } = await supabase
      .from('Device_usage')
      .select('*')
      .eq('device_id', device_id)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (error) throw error;

    res.status(200).json({ device_id, usage_records: data });
  } catch (err) {
    console.error('❌ Error fetching device usage:', err.message);
    res.status(500).json({ error: `Failed to fetch device usage: ${err.message}` });
  }
}

async function putHandler(req, res) {
  const { usage_id, device_id, year, month, usage_hours } = req.body;

  if (!usage_id || !device_id || !year || !month || usage_hours == null) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (isNaN(+usage_hours) || +usage_hours < 0 || isNaN(+year) || isNaN(+month) || +month < 1 || +month > 12) {
    return res.status(400).json({ error: 'Invalid input values.' });
  }

  try {
    const { data, error } = await supabase
      .from('Device_usage')
      .update({
        device_id: +device_id,
        year: +year,
        month: +month,
        usage_hours: +usage_hours,
      })
      .eq('usage_id', usage_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: '✅ Device usage updated successfully.',
      updated_usage: data,
    });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ error: `Failed to update device usage: ${err.message}` });
  }
}

async function deleteHandler(req, res) {
  const { usage_id } = req.body;

  if (!usage_id) {
    return res.status(400).json({ error: 'usage_id is required.' });
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

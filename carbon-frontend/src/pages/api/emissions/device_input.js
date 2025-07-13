// pages/api/emissions/device_input.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  // 🔎 Basic Validation
  if (!device_name || !device_power || !campus_name || !building_name || !room_name || usage_hours == null || !year || !month) {
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
    // 🔍 Cek apakah data sudah ada
    const { data: existingData, error: checkError } = await supabase
      .from('Device_usage')
      .select('usage_id') // cukup pilih id saja untuk efisiensi
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

    // 🚀 Insert data baru jika belum ada
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

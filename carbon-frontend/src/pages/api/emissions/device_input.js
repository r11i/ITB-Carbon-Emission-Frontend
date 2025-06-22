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
    // 🔁 1. Get or Create Campus
    let { data: campusData, error: campusError } = await supabase
      .from('Campuses')
      .select('campus_id')
      .eq('campus_name', campus_name)
      .maybeSingle();

    if (campusError) throw new Error(`Finding campus: ${campusError.message}`);

    if (!campusData) {
      const { data: newCampus, error: insertCampusError } = await supabase
        .from('Campuses')
        .insert([{ campus_name }])
        .select('campus_id')
        .single();
      if (insertCampusError) throw new Error(`Creating campus: ${insertCampusError.message}`);
      campusData = newCampus;
    }

    // 🔁 2. Get or Create Building
    let { data: buildingData, error: buildingError } = await supabase
      .from('Buildings')
      .select('building_id')
      .eq('building_name', building_name)
      .eq('campus_id', campusData.campus_id)
      .maybeSingle();

    if (buildingError) throw new Error(`Finding building: ${buildingError.message}`);

    if (!buildingData) {
      const { data: newBuilding, error: insertBuildingError } = await supabase
        .from('Buildings')
        .insert([{ building_name, campus_id: campusData.campus_id }])
        .select('building_id')
        .single();
      if (insertBuildingError) throw new Error(`Creating building: ${insertBuildingError.message}`);
      buildingData = newBuilding;
    }

    // 🔁 3. Get or Create Room
    let { data: roomData, error: roomError } = await supabase
      .from('Rooms')
      .select('room_id')
      .eq('room_name', room_name)
      .eq('building_id', buildingData.building_id)
      .maybeSingle();

    if (roomError) throw new Error(`Finding room: ${roomError.message}`);

    if (!roomData) {
      const { data: newRoom, error: insertRoomError } = await supabase
        .from('Rooms')
        .insert([{ room_name, building_id: buildingData.building_id }])
        .select('room_id')
        .single();
      if (insertRoomError) throw new Error(`Creating room: ${insertRoomError.message}`);
      roomData = newRoom;
    }

    // 💡 4. Insert Device
    const { data: deviceData, error: deviceError } = await supabase
      .from('Devices')
      .insert([{ device_name, device_power: +device_power, room_id: roomData.room_id }])
      .select('device_id, device_name')
      .single();
    if (deviceError) throw new Error(`Inserting device: ${deviceError.message}`);

    // 💡 5. Insert Device Usage
    const { data: usageData, error: usageError } = await supabase
      .from('Device_usage')
      .insert([
        {
          device_id: deviceData.device_id,
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
      device: deviceData,
      usage: usageData,
    });
  } catch (err) {
    console.error('❌ Error processing device input:', err.message);
    res.status(500).json({ error: `Failed to save data: ${err.message}` });
  }
}

// pages/api/devices/index.js
import { createClient } from '@supabase/supabase-js';
import authenticateUser from '../authenticateUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGetDevices(req, res);
    case 'POST':
      return authenticateUser(req, res, () => handleAddDevice(req, res));
    case 'PUT':
      return authenticateUser(req, res, () => handleUpdateDevice(req, res));
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// GET devices by building and room name
async function handleGetDevices(req, res) {
  const { room_name, building_name } = req.query;

  if (!room_name || !building_name) {
    return res.status(400).json({ error: "Both room_name and building_name are required." });
  }

  try {
    const { data: buildingData, error: buildingError } = await supabase
      .from("Buildings")
      .select("building_id")
      .eq("building_name", building_name)
      .maybeSingle();

    if (buildingError) throw new Error(`Finding building: ${buildingError.message}`);
    if (!buildingData) return res.status(404).json({ error: "Building not found." });

    const { data: roomData, error: roomError } = await supabase
      .from("Rooms")
      .select("room_id")
      .eq("room_name", room_name)
      .eq("building_id", buildingData.building_id)
      .maybeSingle();

    if (roomError) throw new Error(`Finding room: ${roomError.message}`);
    if (!roomData) return res.status(404).json({ error: "Room not found in the specified building." });

    const { data: devices, error: devicesError } = await supabase
      .from("Devices")
      .select("device_id, device_name, device_power")
      .eq("room_id", roomData.room_id);

    if (devicesError) throw new Error(`Fetching devices: ${devicesError.message}`);

    res.json({
      building_name,
      room_name,
      devices,
    });
  } catch (err) {
    console.error("Error fetching devices:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// POST (add) device
async function handleAddDevice(req, res) {
  const { device_name, device_power, room_id } = req.body;

  if (!device_name || !device_power || !room_id) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (isNaN(device_power) || device_power <= 0) {
    return res.status(400).json({ error: "device_power must be a positive number." });
  }

  try {
    const { data, error } = await supabase
      .from("Devices")
      .insert([{ device_name, device_power, room_id }])
      .select("device_id, device_name, device_power, room_id")
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Device added successfully.",
      device: data
    });
  } catch (err) {
    console.error("Add device error:", err.message);
    res.status(500).json({ error: "Failed to add device." });
  }
}

// PUT (update) device
async function handleUpdateDevice(req, res) {
    const { device_id, device_name, device_power, room_id } = req.body;

    // Validasi input
    if (!device_name || !device_power || !room_id) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (isNaN(device_power) || device_power <= 0) {
        return res.status(400).json({ error: "device_power must be a positive number." });
    }

    try {
        // Update hanya data dengan device_id yang cocok
        const { data, error } = await supabase
            .from("Devices")
            .update({
                device_name,
                device_power: parseInt(device_power),
                room_id: parseInt(room_id)
            })
            .eq("device_id", device_id)
            .select()
            .single();

        if (error) {
            console.error("Error updating device:", error.message);
            return res.status(500).json({ error: "Failed to update device." });
        }

        if (!data) {
            return res.status(404).json({ error: "Device not found." });
        }

        res.json({
            message: "Device updated successfully.",
            device: data
        });

    } catch (err) {
        console.error("Unexpected server error:", err.message);
        res.status(500).json({ error: "Server error while updating device." });
    }
}

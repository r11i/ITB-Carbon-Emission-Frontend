import { createClient } from "@supabase/supabase-js";

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default async function handler(req, res) {
  const device_id = parseInt(req.query.device_id);

  if (isNaN(device_id)) {
    return res.status(400).json({ error: "Device ID must be a number." });
  }

  switch (req.method) {
    case "PUT": {
      const { device_name, device_power, room_id } = req.body;

      // Input validation
      if (!device_name || !device_power || !room_id) {
        return res.status(400).json({ error: "All fields are required." });
      }

      try {
        const { data, error } = await supabase
          .from("Devices")
          .update({
            device_name,
            device_power: parseInt(device_power),
            room_id: parseInt(room_id),
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

        return res.status(200).json({
          message: "✅ Device updated successfully.",
          device: data,
        });
      } catch (err) {
        console.error("Update error:", err.message);
        return res
          .status(500)
          .json({ error: "Server error while updating device." });
      }
    }

    case "DELETE": {
      try {
        // Check if device exists
        const { data: existingDevice, error: fetchError } = await supabase
          .from("Devices")
          .select("*")
          .eq("device_id", device_id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!existingDevice) {
          return res.status(404).json({ error: "Device not found." });
        }

        // Delete device
        const { error: deleteError } = await supabase
          .from("Devices")
          .delete()
          .eq("device_id", device_id);

        if (deleteError) throw deleteError;

        return res.status(200).json({
          message: "✅ Device deleted successfully.",
          deleted_device_id: device_id,
        });
      } catch (err) {
        console.error("Delete error:", err.message);
        return res
          .status(500)
          .json({ error: "Server error while deleting device." });
      }
    }

    default:
      res.setHeader("Allow", ["PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

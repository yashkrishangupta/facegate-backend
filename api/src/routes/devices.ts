import { Router } from "express";
import { deviceAuth } from "../middleware/deviceAuth";

import {
    getAllDevices,
    getDeviceById,
    createPendingDevice,
    pairDevice,
    updateDevice,
    heartbeat,
    getDeviceStatus,
    deactivateDevice
} from "../controllers/DeviceController";

const router = Router();

/**
 * Device Routes
 */

// Get All Devices
router.get("/", getAllDevices);

// Device Status
router.get("/status", getDeviceStatus);

// Get Device By ID
router.get("/:deviceId", getDeviceById);

// Create Device (admin, website) — returns a pairing code, not a token.
// Replaces the old self-service POST /register, which let anyone who knew
// a room_id mint themselves a valid device_token with no admin involved.
router.post("/", createPendingDevice);

// Pair Device (physical device, first app launch) — exchanges the pairing
// code for a permanent device_id + device_token.
router.post("/pair", pairDevice);

// Device Heartbeat — device-token protected (was open to anyone before)
router.post("/heartbeat", deviceAuth, heartbeat);

// Update Device
router.put("/:deviceId", updateDevice);

// Deactivate Device
router.delete("/:deviceId", deactivateDevice);

export default router;
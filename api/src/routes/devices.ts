import { Router } from "express";
import { deviceAuth } from "../middleware/deviceAuth";

import {
    getAllDevices,
    getDeviceById,
    registerDevice,
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

// Register Device
router.post("/register", registerDevice);

// Device Heartbeat — device-token protected (was open to anyone before)
router.post("/heartbeat", deviceAuth, heartbeat);

// Update Device
router.put("/:deviceId", updateDevice);

// Deactivate Device
router.delete("/:deviceId", deactivateDevice);

export default router;
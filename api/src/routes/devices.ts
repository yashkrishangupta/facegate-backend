import { Router } from "express";

import {
    getAllDevices,
    getDeviceById,
    registerDevice,
    updateDevice,
    heartbeat,
    getDeviceStatus
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

// Device Heartbeat
router.post("/heartbeat", heartbeat);

// Update Device
router.put("/:deviceId", updateDevice);

export default router;
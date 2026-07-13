import { Router } from "express";
import { deviceAuth } from "../middleware/deviceAuth";
import { requireAuth, requireAdmin } from "../middleware/auth";

import {
    getAllDevices,
    getDeviceById,
    getOwnDevice,
    getDeviceHealth,
    getDeviceSyncHistory,
    createPendingDevice,
    pairDevice,
    updateDevice,
    heartbeat,
    pushChangeLogEvents,
    getDeviceStatus,
    deactivateDevice
} from "../controllers/DeviceController";

const router = Router();

/**
 * Device Routes
 *
 * Two routes stay outside requireAuth on purpose, since neither call is
 * made by a logged-in admin:
 *  - POST /pair — the physical device has no JWT yet; the pairing code
 *    itself is the credential (see architecture doc + API_CONTRACT.md).
 *  - POST /heartbeat — authenticated via the device's own x-api-key
 *    (deviceAuth middleware), not an admin session.
 * Everything else is website/admin traffic and now requires a session.
 */

// Pair Device (physical device, first app launch) — exchanges the pairing
// code for a permanent device_id + device_token.
router.post("/pair", pairDevice);

// Device Heartbeat — device-token protected
router.post("/heartbeat", deviceAuth, heartbeat);

// Push Change-Log Events — device-token protected, device-scoped equivalent
// of the website's read-only /change-log. Not on the backend before this —
// Android's DeviceApi.pushChangeLogEvents had nowhere to send to.
router.post("/change-log", deviceAuth, pushChangeLogEvents);

// Self-check — device-token protected. See getOwnDevice's doc comment:
// this is what GET /devices/{deviceId} was always documented as, but
// never actually was.
router.get("/me", deviceAuth, getOwnDevice);

router.use(requireAuth);

// Get All Devices
router.get("/", getAllDevices);

// Device Status
router.get("/status", getDeviceStatus);

// Get Device By ID
router.get("/:deviceId", getDeviceById);

// Get Device Health
router.get("/:deviceId/health", getDeviceHealth);

// Get Device Sync History
router.get("/:deviceId/sync-history", getDeviceSyncHistory);

// Create Device (admin, website) — returns a pairing code, not a token.
// Replaces the old self-service POST /register, which let anyone who knew
// a room_id mint themselves a valid device_token with no admin involved.
router.post("/", requireAdmin, createPendingDevice);

// Update Device
router.put("/:deviceId", requireAdmin, updateDevice);

// Deactivate Device
router.delete("/:deviceId", requireAdmin, deactivateDevice);

export default router;
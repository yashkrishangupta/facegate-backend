import { deviceAuth } from "../middleware/deviceAuth";
import { Router } from "express";
import {
    fullSync,
    incrementalSync,
    uploadAttendance,
    uploadEmbedding,
    getSyncStatus,
    retrySync
} from "../controllers/SyncController";

const router = Router();
router.use(deviceAuth);

/**
 * Sync Routes
 */

// Full Sync
router.post("/full", fullSync);

// Incremental Sync
router.get("/incremental", incrementalSync);

// Upload Attendance
router.post("/attendance", uploadAttendance);

// Upload Face Embedding (device-side enrollment sync-up)
router.post("/embeddings", uploadEmbedding);

// Sync Status
router.get("/status", getSyncStatus);

// Retry Failed Sync
router.post("/retry", retrySync);

export default router;
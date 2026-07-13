import { deviceAuth } from "../middleware/deviceAuth";
import { Router } from "express";
import {
    fullSync,
    incrementalSync,
    uploadAttendance,
    uploadEmbedding,
    enrollStudent,
    uploadConflicts,
    resolveConflict,
    getReports,
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

// Enroll Student (device-initiated new student + embedding, one call)
router.post("/students/enroll", enrollStudent);

// Push Conflicts (device-detected conflicts, batched)
router.post("/conflicts", uploadConflicts);

// Resolve Conflict (device-authed equivalent of the website's /conflicts/:id/resolve)
router.put("/conflicts/:conflictId/resolve", resolveConflict);

// Reports (read-only, room-scoped)
router.get("/reports", getReports);

// Sync Status
router.get("/status", getSyncStatus);

// Retry Failed Sync
router.post("/retry", retrySync);

export default router;
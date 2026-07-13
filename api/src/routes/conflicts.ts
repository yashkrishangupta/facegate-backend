import { Router } from "express";

import {
    getAllConflicts,
    getConflictById,
    createConflict,
    resolveConflict,
    updateConflictStatus,
    deleteConflict
} from "../controllers/ConflictController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// resolveConflict/updateConflictStatus are open to any authenticated role
// (including FACULTY, per the plan that faculty can resolve conflicts for
// batches they teach). GET / is now faculty-scoped (see ConflictController's
// facultyScope helper); the write actions themselves are not yet scoped to
// "only rows tied to this faculty member" — flagged as follow-up.
router.use(requireAuth);

/**
 * Conflict Routes
 */

// Get All Conflicts
router.get("/", getAllConflicts);

// Get Conflict By ID
router.get("/:conflictId", getConflictById);

// Create Conflict
router.post("/", requireAdmin, createConflict);

// Resolve Conflict (sets RESOLVED specifically, requires notes)
router.put("/:conflictId/resolve", resolveConflict);

// Update Conflict Status (UNDER_REVIEW / REJECTED — previously unreachable)
router.put("/:conflictId/status", updateConflictStatus);

// Delete Conflict
router.delete("/:conflictId", requireAdmin, deleteConflict);

export default router;
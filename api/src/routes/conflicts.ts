import { Router } from "express";

import {
    getAllConflicts,
    getConflictById,
    createConflict,
    resolveConflict,
    deleteConflict
} from "../controllers/ConflictController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// NOTE: resolveConflict is intentionally open to any authenticated role
// (including FACULTY, per the plan that faculty can resolve conflicts for
// batches they teach) — row-level scoping to "only their own batches" is
// NOT yet enforced in ConflictRepository's query itself; this only gates
// who can call the endpoint, not which rows they can act on. Flagging this
// explicitly as follow-up work rather than silently leaving it unscoped.
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

// Resolve Conflict
router.put("/:conflictId/resolve", resolveConflict);

// Delete Conflict
router.delete("/:conflictId", requireAdmin, deleteConflict);

export default router;
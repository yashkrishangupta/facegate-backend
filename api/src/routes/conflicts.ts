import { Router } from "express";

import {
    getAllConflicts,
    getConflictById,
    createConflict,
    resolveConflict,
    deleteConflict
} from "../controllers/ConflictController";

const router = Router();

/**
 * Conflict Routes
 */

// Get All Conflicts
router.get("/", getAllConflicts);

// Get Conflict By ID
router.get("/:conflictId", getConflictById);

// Create Conflict
router.post("/", createConflict);

// Resolve Conflict
router.put("/:conflictId/resolve", resolveConflict);

// Delete Conflict
router.delete("/:conflictId", deleteConflict);

export default router;
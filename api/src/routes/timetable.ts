import { Router } from "express";

import {
    getAllTimetable,
    getTimetableByBatch,
    getTimetableByFaculty,
    getTodayTimetable,
    createTimetable,
    updateTimetable,
    deleteTimetable
} from "../controllers/TimetableController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

/**
 * Timetable Routes
 */

// Today's Timetable
router.get("/today", getTodayTimetable);

// Get by Batch
router.get("/batch/:batchId", getTimetableByBatch);

// Get by Faculty
router.get("/faculty/:facultyId", getTimetableByFaculty);

// Get All
router.get("/", getAllTimetable);

// Create
router.post("/", requireAdmin, createTimetable);

// Update
router.put("/:timetableId", requireAdmin, updateTimetable);

// Delete
router.delete("/:timetableId", requireAdmin, deleteTimetable);

export default router;
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

const router = Router();

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
router.post("/", createTimetable);

// Update
router.put("/:timetableId", updateTimetable);

// Delete
router.delete("/:timetableId", deleteTimetable);

export default router;
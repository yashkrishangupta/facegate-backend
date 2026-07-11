import { Router } from "express";

import {
    getDailyReport,
    getStudentReport,
    getFacultyReport,
    getDepartmentReport,
    getSummaryReport
} from "../controllers/ReportController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// NOTE: open to any authenticated role, including FACULTY — per-faculty
// row scoping ("only batches I teach") is NOT yet enforced inside
// ReportRepository's queries. Flagging as follow-up, not silently skipping.
router.use(requireAuth);

/**
 * Report Routes
 */

// Dashboard Summary
router.get("/summary", getSummaryReport);

// Daily Attendance Report
router.get("/daily", getDailyReport);

// Student Report
router.get("/student/:studentId", getStudentReport);

// Faculty Report
router.get("/faculty/:facultyId", getFacultyReport);

// Department Report
router.get("/department/:departmentId", getDepartmentReport);

export default router;
import { Router } from "express";

import {
    getDailyReport,
    getStudentReport,
    getBatchReport,
    getSubjectReport,
    getRoomReport,
    getFacultyReport,
    getDepartmentReport,
    getSummaryReport,
    exportReport
} from "../controllers/ReportController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Open to any authenticated role, including FACULTY. A FACULTY caller is
// blocked from requesting another faculty member's report (checked in the
// controller); the daily/summary/department aggregates stay visible to
// every role (no individual student PII tied to a specific other faculty).
router.use(requireAuth);

/**
 * Report Routes
 */

// Dashboard Summary
router.get("/summary", getSummaryReport);

// Daily Attendance Report
router.get("/daily", getDailyReport);

// Export (CSV) — referenced by the frontend since it was first built, no route existed until now
router.get("/export", exportReport);

// Student Report
router.get("/student/:studentId", getStudentReport);

// Batch Report
router.get("/batch/:batchId", getBatchReport);

// Subject Report
router.get("/subject/:subjectId", getSubjectReport);

// Room Report
router.get("/room/:roomId", getRoomReport);

// Faculty Report
router.get("/faculty/:facultyId", getFacultyReport);

// Department Report
router.get("/department/:departmentId", getDepartmentReport);

export default router;
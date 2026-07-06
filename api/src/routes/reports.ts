import { Router } from "express";

import {
    getDailyReport,
    getStudentReport,
    getFacultyReport,
    getDepartmentReport,
    getSummaryReport
} from "../controllers/ReportController";

const router = Router();

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
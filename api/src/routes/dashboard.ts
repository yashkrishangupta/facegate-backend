import { Router } from "express";

import {
    getDashboardSummary,
    getRecentAttendance,
    getRecentConflicts,
    getRecentNotifications
} from "../controllers/DashboardController";

const router = Router();

/**
 * Dashboard Routes
 */

// Dashboard Summary
router.get("/summary", getDashboardSummary);

// Recent Attendance
router.get("/attendance", getRecentAttendance);

// Recent Conflicts
router.get("/conflicts", getRecentConflicts);

// Recent Notifications
router.get("/notifications", getRecentNotifications);

export default router;
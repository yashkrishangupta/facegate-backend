import { Router } from "express";

import {
    markAttendance,
    getAttendanceBySession,
    getAttendanceByStudent,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary
} from "../controllers/AttendanceController";

const router = Router();

/**
 * Attendance Routes
 */

// Mark Attendance
router.post("/mark", markAttendance);

// Attendance Summary
router.get("/summary/:sessionId", getAttendanceSummary);

// Attendance by Session
router.get("/session/:sessionId", getAttendanceBySession);

// Attendance by Student
router.get("/student/:studentId", getAttendanceByStudent);

// Update Attendance
router.put("/:attendanceId", updateAttendance);

// Delete Attendance
router.delete("/:attendanceId", deleteAttendance);

export default router;
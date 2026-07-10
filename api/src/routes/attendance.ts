import { Router } from "express";

import {
    markAttendance,
    getAttendanceBySession,
    getAttendanceByStudent,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary
} from "../controllers/AttendanceController";
import { deviceAuth } from "../middleware/deviceAuth";

const router = Router();

/**
 * Attendance Routes
 */

// Mark Attendance (face recognition, from a paired device) — device-token
// protected. API_CONTRACT.md always documented this as "Device Token
// Required" but the route had no middleware applied; anyone with network
// access could write attendance for any student/session with no
// credential at all.
router.post("/mark", deviceAuth, markAttendance);

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
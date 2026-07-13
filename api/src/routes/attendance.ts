import { Router } from "express";

import {
    markAttendance,
    markAttendanceManual,
    getAttendanceBySession,
    getAttendanceByStudent,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary
} from "../controllers/AttendanceController";
import { deviceAuth } from "../middleware/deviceAuth";
import { requireAuth } from "../middleware/auth";

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

// Everything below is website traffic (viewing/manually correcting
// attendance) — requires an admin/faculty session. Per-faculty row scoping
// ("only sessions I teach") is NOT yet enforced in the query layer — see
// the same caveat on reports.ts/conflicts.ts.
router.use(requireAuth);

// Manual Attendance (bulk, whole session, from the website)
router.post("/manual", markAttendanceManual);

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
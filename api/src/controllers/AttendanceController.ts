import { Request, Response } from "express";
import * as AttendanceService from "../services/AttendanceService";

/**
 * A FACULTY-role caller only sees attendance for sessions they teach —
 * everyone else (ADMIN/SUPER_ADMIN/VIEWER) sees everything. Returns null
 * for non-faculty roles, which the repository layer treats as "no filter".
 */
const facultyScope = (req: Request): string | null =>
    req.user?.role === "FACULTY" ? req.user.facultyId : null;

/**
 * POST /attendance/manual — bulk marking for a whole session at once, from
 * the website. Documented since the earliest contract drafts but never
 * actually built until now.
 */
export const markAttendanceManual = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const { timetable_id, session_date, records } = req.body;
        const result = await AttendanceService.markAttendanceManual(timetable_id, session_date, records);

        res.status(200).json({
            success: true,
            message: `Marked attendance for ${result.marked} student(s)`,
            data: result
        });

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err?.message || "Failed to mark manual attendance"
        });

    }

};

/**
 * POST /attendance/mark
 */
export const markAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const attendance = await AttendanceService.markAttendance(req.body);

        res.status(201).json({
            success: true,
            message: "Attendance marked successfully",
            data: attendance
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to mark attendance"
        });

    }

};

/**
 * GET /attendance/session/:sessionId
 */
export const getAttendanceBySession = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const sessionId = req.params.sessionId as string;

        const attendance =
            await AttendanceService.getAttendanceBySession(sessionId, facultyScope(req));

        res.status(200).json({
            success: true,
            data: attendance
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch session attendance"
        });

    }

};

/**
 * GET /attendance/student/:studentId
 */
export const getAttendanceByStudent = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const studentId = req.params.studentId as string;

        const attendance =
            await AttendanceService.getAttendanceByStudent(studentId, facultyScope(req));

        res.status(200).json({
            success: true,
            data: attendance
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch student attendance"
        });

    }

};

/**
 * PUT /attendance/:attendanceId
 */
export const updateAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const attendanceId = req.params.attendanceId as string;

        const updatedAttendance =
            await AttendanceService.updateAttendance(
                attendanceId,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            data: updatedAttendance
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to update attendance"
        });

    }

};

/**
 * DELETE /attendance/:attendanceId
 */
export const deleteAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const attendanceId = req.params.attendanceId as string;

        await AttendanceService.deleteAttendance(attendanceId);

        res.status(200).json({
            success: true,
            message: "Attendance deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to delete attendance"
        });

    }

};

/**
 * GET /attendance/summary/:sessionId
 */
export const getAttendanceSummary = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const sessionId = req.params.sessionId as string;

        const summary =
            await AttendanceService.getAttendanceSummary(sessionId);

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance summary"
        });

    }

};
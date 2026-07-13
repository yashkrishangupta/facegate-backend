import * as AttendanceRepository from "../repositories/AttendanceRepository";

/**
 * Mark Attendance
 */
export const markAttendanceManual = async (timetableId: string, sessionDate: string, records: any[]) => {
    if (!timetableId) throw new Error("timetable_id is required");
    if (!sessionDate) throw new Error("session_date is required");
    if (!Array.isArray(records) || records.length === 0) throw new Error("records must be a non-empty array");
    for (const r of records) {
        if (!r.student_id) throw new Error("every record needs a student_id");
    }
    return await AttendanceRepository.markAttendanceManual(timetableId, sessionDate, records);
};

export const markAttendance = async (attendanceData: any) => {
    return await AttendanceRepository.markAttendance(attendanceData);
};

/**
 * Get Attendance by Session
 */
export const getAttendanceBySession = async (
    sessionId: string,
    facultyId?: string | null
) => {
    return await AttendanceRepository.getAttendanceBySession(sessionId, facultyId);
};

/**
 * Get Attendance by Student
 */
export const getAttendanceByStudent = async (
    studentId: string,
    facultyId?: string | null
) => {
    return await AttendanceRepository.getAttendanceByStudent(studentId, facultyId);
};

/**
 * Update Attendance
 */
export const updateAttendance = async (
    attendanceId: string,
    attendanceData: any
) => {
    return await AttendanceRepository.updateAttendance(
        attendanceId,
        attendanceData
    );
};

/**
 * Delete Attendance
 */
export const deleteAttendance = async (
    attendanceId: string
) => {
    return await AttendanceRepository.deleteAttendance(attendanceId);
};

/**
 * Attendance Summary
 */
export const getAttendanceSummary = async (
    sessionId: string
) => {
    return await AttendanceRepository.getAttendanceSummary(sessionId);
};
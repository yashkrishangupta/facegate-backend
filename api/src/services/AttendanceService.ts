import * as AttendanceRepository from "../repositories/AttendanceRepository";

/**
 * Mark Attendance
 */
export const markAttendance = async (attendanceData: any) => {
    return await AttendanceRepository.markAttendance(attendanceData);
};

/**
 * Get Attendance by Session
 */
export const getAttendanceBySession = async (
    sessionId: string
) => {
    return await AttendanceRepository.getAttendanceBySession(sessionId);
};

/**
 * Get Attendance by Student
 */
export const getAttendanceByStudent = async (
    studentId: string
) => {
    return await AttendanceRepository.getAttendanceByStudent(studentId);
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
/**
 * Mock Attendance Repository
 */

let attendanceRecords = [
    {
        attendanceId: "A001",
        sessionId: "SESSION001",
        studentId: "S001",
        studentName: "Mahima Goyal",
        status: "PRESENT",
        attendanceMode: "FACE_RECOGNITION",
        confidence: 98.75,
        timestamp: "2026-07-06T09:01:12Z"
    },
    {
        attendanceId: "A002",
        sessionId: "SESSION001",
        studentId: "S002",
        studentName: "Rahul Sharma",
        status: "ABSENT",
        attendanceMode: "MANUAL",
        confidence: null,
        timestamp: "2026-07-06T09:00:00Z"
    }
];

/**
 * Mark Attendance
 */
export const markAttendance = async (attendanceData: any) => {

    const newAttendance = {
        attendanceId: `A${attendanceRecords.length + 1}`,
        ...attendanceData
    };

    attendanceRecords.push(newAttendance);

    return newAttendance;
};

/**
 * Get Attendance by Session
 */
export const getAttendanceBySession = async (
    sessionId: string
) => {

    return attendanceRecords.filter(
        attendance => attendance.sessionId === sessionId
    );
};

/**
 * Get Attendance by Student
 */
export const getAttendanceByStudent = async (
    studentId: string
) => {

    return attendanceRecords.filter(
        attendance => attendance.studentId === studentId
    );
};

/**
 * Update Attendance
 */
export const updateAttendance = async (
    attendanceId: string,
    attendanceData: any
) => {

    const attendance = attendanceRecords.find(
        attendance => attendance.attendanceId === attendanceId
    );

    if (!attendance) {
        return null;
    }

    Object.assign(attendance, attendanceData);

    return attendance;
};

/**
 * Delete Attendance
 */
export const deleteAttendance = async (
    attendanceId: string
) => {

    attendanceRecords = attendanceRecords.filter(
        attendance => attendance.attendanceId !== attendanceId
    );

    return {
        success: true
    };
};

/**
 * Attendance Summary
 */
export const getAttendanceSummary = async (
    sessionId: string
) => {

    const sessionAttendance = attendanceRecords.filter(
        attendance => attendance.sessionId === sessionId
    );

    const present = sessionAttendance.filter(
        attendance => attendance.status === "PRESENT"
    ).length;

    const absent = sessionAttendance.filter(
        attendance => attendance.status === "ABSENT"
    ).length;

    return {
        sessionId,
        totalStudents: sessionAttendance.length,
        present,
        absent,
        attendancePercentage:
            sessionAttendance.length === 0
                ? 0
                : ((present / sessionAttendance.length) * 100).toFixed(2)
    };
};
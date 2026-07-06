/**
 * Mock Report Repository
 */

/**
 * Daily Attendance Report
 */
export const getDailyReport = async () => {

    return {
        date: "2026-07-06",
        totalStudents: 240,
        present: 218,
        absent: 22,
        attendancePercentage: 90.83
    };

};

/**
 * Student Attendance Report
 */
export const getStudentReport = async (
    studentId: string
) => {

    return {
        studentId,
        studentName: "Mahima Goyal",
        totalClasses: 45,
        attendedClasses: 42,
        missedClasses: 3,
        attendancePercentage: 93.33
    };

};

/**
 * Faculty Attendance Report
 */
export const getFacultyReport = async (
    facultyId: string
) => {

    return {
        facultyId,
        facultyName: "Dr. Rajesh Sharma",
        totalSessions: 36,
        completedSessions: 35,
        cancelledSessions: 1
    };

};

/**
 * Department Attendance Report
 */
export const getDepartmentReport = async (
    departmentId: string
) => {

    return {
        departmentId,
        departmentName: "Computer Science",
        totalStudents: 240,
        averageAttendance: 91.45
    };

};

/**
 * Summary Report
 */
export const getSummaryReport = async () => {

    return {

        totalStudents: 240,

        totalFaculty: 18,

        totalAttendanceRecords: 10542,

        averageAttendance: 91.2,

        activeDevices: 5,

        pendingConflicts: 2,

        generatedAt: new Date().toISOString()

    };

};
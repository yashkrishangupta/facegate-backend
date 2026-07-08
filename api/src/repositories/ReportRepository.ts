import pool from "../config/database";

/**
 * Report Repository
 * Read-only aggregate queries over attendance/session data, filterable by
 * student / faculty / department / date — matches Section 5 of the
 * architecture doc ("one attendance table, filterable by SQL WHERE+JOIN").
 */

export const getDailyReport = async (date?: string) => {

    const targetDate = date ?? new Date().toISOString().slice(0, 10);

    const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present,
            COUNT(*) FILTER (WHERE attendance_status = 'ABSENT') AS absent,
            COUNT(*) AS total
         FROM attendance
         WHERE is_active = TRUE AND attendance_time::date = $1`,
        [targetDate]
    );

    const row = result.rows[0];
    const total = Number(row.total);
    const present = Number(row.present);
    const absent = Number(row.absent);

    return {
        date: targetDate,
        totalStudents: total,
        present,
        absent,
        attendancePercentage: total === 0 ? 0 : Number(((present / total) * 100).toFixed(2))
    };
};

export const getStudentReport = async (studentId: string) => {

    const nameResult = await pool.query(
        `SELECT first_name || ' ' || last_name AS student_name FROM student WHERE student_id = $1`,
        [studentId]
    );

    const statsResult = await pool.query(
        `SELECT
            COUNT(*) AS total_classes,
            COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS attended
         FROM attendance
         WHERE student_id = $1 AND is_active = TRUE`,
        [studentId]
    );

    const stats = statsResult.rows[0];
    const totalClasses = Number(stats.total_classes);
    const attendedClasses = Number(stats.attended);

    return {
        studentId,
        studentName: nameResult.rows[0]?.student_name ?? null,
        totalClasses,
        attendedClasses,
        missedClasses: totalClasses - attendedClasses,
        attendancePercentage:
            totalClasses === 0 ? 0 : Number(((attendedClasses / totalClasses) * 100).toFixed(2))
    };
};

export const getFacultyReport = async (facultyId: string) => {

    const nameResult = await pool.query(
        `SELECT first_name || ' ' || last_name AS faculty_name FROM faculty WHERE faculty_id = $1`,
        [facultyId]
    );

    const sessionResult = await pool.query(
        `SELECT
            COUNT(*) AS total_sessions,
            COUNT(*) FILTER (WHERE ases.session_status = 'COMPLETED') AS completed,
            COUNT(*) FILTER (WHERE ases.session_status = 'CANCELLED') AS cancelled
         FROM attendance_session ases
         JOIN timetable t ON t.timetable_id = ases.timetable_id
         WHERE t.faculty_id = $1 AND ases.is_active = TRUE`,
        [facultyId]
    );

    const stats = sessionResult.rows[0];

    return {
        facultyId,
        facultyName: nameResult.rows[0]?.faculty_name ?? null,
        totalSessions: Number(stats.total_sessions),
        completedSessions: Number(stats.completed),
        cancelledSessions: Number(stats.cancelled)
    };
};

export const getDepartmentReport = async (departmentId: string) => {

    const nameResult = await pool.query(
        `SELECT department_name FROM department WHERE department_id = $1`,
        [departmentId]
    );

    const statsResult = await pool.query(
        `SELECT
            COUNT(DISTINCT s.student_id) AS total_students,
            COUNT(a.attendance_id) FILTER (WHERE a.attendance_status = 'PRESENT') AS present,
            COUNT(a.attendance_id) AS total_marks
         FROM student s
         JOIN batch b ON b.batch_id = s.batch_id
         LEFT JOIN attendance a ON a.student_id = s.student_id AND a.is_active = TRUE
         WHERE b.department_id = $1 AND s.is_active = TRUE`,
        [departmentId]
    );

    const stats = statsResult.rows[0];
    const totalMarks = Number(stats.total_marks);
    const present = Number(stats.present);

    return {
        departmentId,
        departmentName: nameResult.rows[0]?.department_name ?? null,
        totalStudents: Number(stats.total_students),
        averageAttendance: totalMarks === 0 ? 0 : Number(((present / totalMarks) * 100).toFixed(2))
    };
};

export const getSummaryReport = async () => {

    const [students, faculty, attendance, devices, conflicts] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM student WHERE is_active = TRUE`),
        pool.query(`SELECT COUNT(*) FROM faculty WHERE is_active = TRUE`),
        pool.query(
            `SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present
             FROM attendance WHERE is_active = TRUE`
        ),
        pool.query(`SELECT COUNT(*) FROM device WHERE device_status = 'ACTIVE' AND is_active = TRUE`),
        pool.query(`SELECT COUNT(*) FROM conflict WHERE conflict_status = 'PENDING' AND is_active = TRUE`)
    ]);

    const attRow = attendance.rows[0];
    const total = Number(attRow.total);
    const present = Number(attRow.present);

    return {
        totalStudents: Number(students.rows[0].count),
        totalFaculty: Number(faculty.rows[0].count),
        totalAttendanceRecords: total,
        averageAttendance: total === 0 ? 0 : Number(((present / total) * 100).toFixed(2)),
        activeDevices: Number(devices.rows[0].count),
        pendingConflicts: Number(conflicts.rows[0].count),
        generatedAt: new Date().toISOString()
    };
};
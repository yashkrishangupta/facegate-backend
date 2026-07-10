import pool from "../config/database";

/**
 * Dashboard Repository
 * Aggregate "at a glance" queries across students, devices, attendance,
 * conflicts and notifications — powers the admin dashboard home screen.
 */

export const getDashboardSummary = async () => {

    const [
        students,
        faculty,
        departments,
        devices,
        todayClasses,
        attendanceToday,
        conflicts,
        notifications,
        lastSync
    ] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM student WHERE is_active = TRUE`),
        pool.query(`SELECT COUNT(*) FROM faculty WHERE is_active = TRUE`),
        pool.query(`SELECT COUNT(*) FROM department WHERE is_active = TRUE`),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE device_status = 'ACTIVE') AS active,
                COUNT(*) FILTER (WHERE device_status != 'ACTIVE') AS offline
             FROM device WHERE is_active = TRUE`
        ),
        pool.query(
            `SELECT COUNT(*) FROM timetable t
             WHERE t.is_active = TRUE
               AND UPPER(t.day_of_week) = UPPER(TO_CHAR(CURRENT_DATE, 'FMDay'))`
        ),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present,
                COUNT(*) AS total
             FROM attendance
             WHERE is_active = TRUE AND attendance_time::date = CURRENT_DATE`
        ),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE conflict_status = 'PENDING') AS pending,
                COUNT(*) FILTER (WHERE conflict_status = 'RESOLVED') AS resolved
             FROM conflict WHERE is_active = TRUE`
        ),
        pool.query(
            `SELECT COUNT(*) FROM notification WHERE is_read = FALSE AND is_active = TRUE`
        ),
        pool.query(
            `SELECT MAX(last_sync) AS last_sync FROM device`
        )
    ]);

    const deviceRow = devices.rows[0];
    const attRow = attendanceToday.rows[0];
    const conflictRow = conflicts.rows[0];
    const present = Number(attRow.present);
    const total = Number(attRow.total);

    return {
        totalStudents: Number(students.rows[0].count),
        totalFaculty: Number(faculty.rows[0].count),
        totalDepartments: Number(departments.rows[0].count),
        activeDevices: Number(deviceRow.active),
        offlineDevices: Number(deviceRow.offline),
        todayClasses: Number(todayClasses.rows[0].count),
        attendanceToday: present,
        attendancePercentage: total === 0 ? 0 : Number(((present / total) * 100).toFixed(2)),
        pendingConflicts: Number(conflictRow.pending),
        resolvedConflicts: Number(conflictRow.resolved),
        unreadNotifications: Number(notifications.rows[0].count),
        lastSync: lastSync.rows[0].last_sync
    };
};

export const getRecentAttendance = async () => {
    const result = await pool.query(
        `SELECT
            a.attendance_id,
            s.first_name || ' ' || s.last_name AS student_name,
            sub.subject_name AS subject,
            r.room_number AS room,
            a.attendance_status AS status,
            TO_CHAR(a.attendance_time, 'HH12:MI AM') AS time
         FROM attendance a
         JOIN student s ON s.student_id = a.student_id
         JOIN attendance_session ases ON ases.attendance_session_id = a.attendance_session_id
         JOIN timetable t ON t.timetable_id = ases.timetable_id
         JOIN subject sub ON sub.subject_id = t.subject_id
         JOIN room r ON r.room_id = t.room_id
         WHERE a.is_active = TRUE
         ORDER BY a.attendance_time DESC
         LIMIT 10`
    );
    return result.rows;
};

export const getRecentConflicts = async () => {
    const result = await pool.query(
        `SELECT
            c.conflict_id,
            s.first_name || ' ' || s.last_name AS student_name,
            c.conflict_type AS type,
            c.conflict_status AS status
         FROM conflict c
         LEFT JOIN student s ON s.student_id = c.student_id
         WHERE c.is_active = TRUE
         ORDER BY c.created_at DESC
         LIMIT 10`
    );
    return result.rows;
};

export const getRecentNotifications = async () => {
    const result = await pool.query(
        `SELECT notification_id, title, priority, is_read
         FROM notification
         WHERE is_active = TRUE
         ORDER BY created_at DESC
         LIMIT 10`
    );
    return result.rows;
};

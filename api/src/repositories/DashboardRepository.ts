import pool from "../config/database";

/**
 * Dashboard Repository
 * Aggregate "at a glance" queries across students, devices, attendance,
 * conflicts and notifications — powers the admin dashboard home screen.
 */

/**
 * facultyId scopes todayClasses/attendanceToday/attendancePercentage/
 * pendingConflicts/resolvedConflicts/totalStudents to a FACULTY caller's
 * own sessions — the same figures scoped in ReportRepository.
 * totalFaculty/totalDepartments/activeDevices/offlineDevices/
 * unreadNotifications/lastSync stay institution-wide.
 */
export const getDashboardSummary = async (facultyId?: string | null) => {

    const classesFacultyWhere = facultyId ? `AND t.faculty_id = $1` : "";
    const classesParams = facultyId ? [facultyId] : [];

    const attFacultyJoin = facultyId
        ? `JOIN attendance_session ases ON ases.attendance_session_id = attendance.attendance_session_id
           JOIN timetable t2 ON t2.timetable_id = ases.timetable_id`
        : "";
    const attFacultyWhere = facultyId ? `AND t2.faculty_id = $1` : "";

    const conflictFacultyJoin = facultyId
        ? `JOIN attendance_session ases2 ON ases2.attendance_session_id = conflict.attendance_session_id
           JOIN timetable t3 ON t3.timetable_id = ases2.timetable_id`
        : "";
    const conflictFacultyWhere = facultyId ? `AND t3.faculty_id = $1` : "";

    const studentCountQuery = facultyId
        ? `SELECT COUNT(DISTINCT s.student_id) FROM student s
           JOIN timetable t4 ON t4.batch_id = s.batch_id
           WHERE s.is_active = TRUE AND t4.faculty_id = $1`
        : `SELECT COUNT(*) FROM student WHERE is_active = TRUE`;

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
        pool.query(studentCountQuery, classesParams),
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
               AND UPPER(t.day_of_week) = UPPER(TO_CHAR(CURRENT_DATE, 'FMDay'))
               ${classesFacultyWhere}`,
            classesParams
        ),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE attendance.attendance_status = 'PRESENT') AS present,
                COUNT(*) AS total
             FROM attendance
             ${attFacultyJoin}
             WHERE attendance.is_active = TRUE AND attendance.attendance_time::date = CURRENT_DATE ${attFacultyWhere}`,
            classesParams
        ),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE conflict.conflict_status = 'PENDING') AS pending,
                COUNT(*) FILTER (WHERE conflict.conflict_status = 'RESOLVED') AS resolved
             FROM conflict
             ${conflictFacultyJoin}
             WHERE conflict.is_active = TRUE ${conflictFacultyWhere}`,
            classesParams
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

/**
 * facultyId scopes this to sessions the caller teaches — previously this
 * showed every faculty member's attendance activity (student names
 * included) to any authenticated FACULTY account, which is exactly the
 * individual-student-data-tied-to-another-faculty-member's-class leak that
 * /attendance/session/:id, /attendance/student/:id, and /conflicts were
 * already protected against.
 */
export const getRecentAttendance = async (facultyId?: string | null) => {
    const facultyWhere = facultyId ? `AND t.faculty_id = $1` : "";
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
         WHERE a.is_active = TRUE ${facultyWhere}
         ORDER BY a.attendance_time DESC
         LIMIT 10`,
        facultyId ? [facultyId] : []
    );
    return result.rows;
};

/**
 * facultyId scopes this the same way — see getRecentAttendance. A
 * conflict with no resolvable session (attendance_session_id NULL) is
 * excluded for a FACULTY caller rather than shown, since ownership can't
 * be determined; ADMIN+/VIEWER still see everything via the unscoped path.
 */
export const getRecentConflicts = async (facultyId?: string | null) => {
    const facultyJoin = facultyId
        ? `JOIN attendance_session ases ON ases.attendance_session_id = c.attendance_session_id
           JOIN timetable t ON t.timetable_id = ases.timetable_id`
        : "";
    const facultyWhere = facultyId ? `AND t.faculty_id = $1` : "";
    const result = await pool.query(
        `SELECT
            c.conflict_id,
            s.first_name || ' ' || s.last_name AS student_name,
            c.conflict_type AS type,
            c.conflict_status AS status
         FROM conflict c
         LEFT JOIN student s ON s.student_id = c.student_id
         ${facultyJoin}
         WHERE c.is_active = TRUE ${facultyWhere}
         ORDER BY c.created_at DESC
         LIMIT 10`,
        facultyId ? [facultyId] : []
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

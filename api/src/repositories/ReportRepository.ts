import pool from "../config/database";

/**
 * Report Repository
 * Read-only aggregate queries over attendance/session data, filterable by
 * student / faculty / department / date — matches Section 5 of the
 * architecture doc ("one attendance table, filterable by SQL WHERE+JOIN").
 */

/**
 * Raw attendance rows for CSV export — one row per attendance record,
 * scoped by whichever report type/id the Reports page currently has open.
 */
export const getExportRows = async (
    reportType: "student" | "batch" | "subject",
    id: string,
    from?: string,
    to?: string
) => {
    const idCondition = reportType === "student" 
        ? "(a.student_id::text = $1 OR s.roll_number ILIKE $1 OR s.registration_number ILIKE $1 OR (s.first_name || ' ' || s.last_name) ILIKE $1)"
        : reportType === "batch" 
        ? "s.batch_id = $1"
        : "t.subject_id = $1";

    const conditions = [idCondition, "a.is_active = TRUE"];
    const values: any[] = [id];

    if (from) { values.push(from); conditions.push(`a.attendance_time::date >= $${values.length}`); }
    if (to) { values.push(to); conditions.push(`a.attendance_time::date <= $${values.length}`); }

    const result = await pool.query(
        `SELECT
            a.attendance_time::date AS date,
            s.first_name || ' ' || s.last_name AS student_name,
            s.roll_number,
            b.batch_code,
            sub.subject_code,
            sub.subject_name,
            f.first_name || ' ' || f.last_name AS faculty_name,
            a.attendance_status AS status,
            a.attendance_mode
         FROM attendance a
         JOIN student s ON s.student_id = a.student_id
         JOIN batch b ON b.batch_id = s.batch_id
         JOIN attendance_session ases ON ases.attendance_session_id = a.attendance_session_id
         JOIN timetable t ON t.timetable_id = ases.timetable_id
         JOIN subject sub ON sub.subject_id = t.subject_id
         JOIN faculty f ON f.faculty_id = t.faculty_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY a.attendance_time DESC`,
        values
    );
    return result.rows;
};

/**
 * facultyId, when provided (a FACULTY-role caller), scopes the count to
 * attendance rows tied to sessions that faculty member teaches — the same
 * row-scoping already applied to /attendance, /conflicts, and
 * /reports/faculty/:id, previously missing here (see API_CONTRACT.md §1's
 * caveat, now closed).
 */
export const getDailyReport = async (date?: string, facultyId?: string | null) => {

    const targetDate = date ?? new Date().toISOString().slice(0, 10);

    const conditions = ["a.is_active = TRUE", "a.attendance_time::date = $1"];
    const values: any[] = [targetDate];

    const facultyJoin = facultyId
        ? `JOIN attendance_session ases ON ases.attendance_session_id = a.attendance_session_id
           JOIN timetable t ON t.timetable_id = ases.timetable_id`
        : "";
    if (facultyId) {
        values.push(facultyId);
        conditions.push(`t.faculty_id = $${values.length}`);
    }

    const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE a.attendance_status = 'PRESENT') AS present,
            COUNT(*) FILTER (WHERE a.attendance_status = 'ABSENT') AS absent,
            COUNT(*) AS total
         FROM attendance a
         ${facultyJoin}
         WHERE ${conditions.join(" AND ")}`,
        values
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

export const getStudentReport = async (studentSearch: string, from?: string, to?: string, semester?: string) => {

    const studentResult = await pool.query(
        `SELECT s.student_id, s.first_name || ' ' || s.last_name AS student_name, b.batch_code AS batch
         FROM student s
         JOIN batch b ON b.batch_id = s.batch_id
         WHERE s.student_id::text = $1
            OR s.roll_number ILIKE $1
            OR s.registration_number ILIKE $1
            OR (s.first_name || ' ' || s.last_name) ILIKE $1
         LIMIT 1`,
        [studentSearch]
    );

    if (studentResult.rows.length === 0) {
        throw new Error("Student not found");
    }

    const student = studentResult.rows[0];
    const resolvedStudentId = student.student_id;

    const overallConditions = ["a.student_id = $1", "a.is_active = TRUE"];
    const overallValues: any[] = [resolvedStudentId];

    let overallJoinClause = "";
    if (semester) {
        overallJoinClause = `JOIN attendance_session ases ON ases.attendance_session_id = a.attendance_session_id
                             JOIN timetable t ON t.timetable_id = ases.timetable_id
                             JOIN subject sub ON sub.subject_id = t.subject_id`;
        overallValues.push(semester);
        overallConditions.push(`sub.semester = $${overallValues.length}`);
    }

    if (from) { overallValues.push(from); overallConditions.push(`a.attendance_time::date >= $${overallValues.length}`); }
    if (to) { overallValues.push(to); overallConditions.push(`a.attendance_time::date <= $${overallValues.length}`); }

    const overallResult = await pool.query(
        `SELECT
            COUNT(*) AS total_classes,
            COUNT(*) FILTER (WHERE a.attendance_status = 'PRESENT') AS attended
         FROM attendance a
         ${overallJoinClause}
         WHERE ${overallConditions.join(" AND ")}`,
        overallValues
    );

    const overall = overallResult.rows[0];
    const totalClasses = Number(overall.total_classes);
    const totalPresent = Number(overall.attended);

    const subjectConditions = ["a.student_id = $1", "a.is_active = TRUE"];
    const subjectValues: any[] = [resolvedStudentId];

    if (from) { subjectValues.push(from); subjectConditions.push(`a.attendance_time::date >= $${subjectValues.length}`); }
    if (to) { subjectValues.push(to); subjectConditions.push(`a.attendance_time::date <= $${subjectValues.length}`); }
    if (semester) { subjectValues.push(semester); subjectConditions.push(`sub.semester = $${subjectValues.length}`); }

    const subjectsResult = await pool.query(
        `SELECT
            sub.subject_id,
            sub.subject_code,
            sub.subject_name AS subject,
            COUNT(a.attendance_id) FILTER (WHERE a.attendance_status = 'PRESENT') AS present,
            COUNT(a.attendance_id) AS total
         FROM attendance a
         JOIN attendance_session ases ON ases.attendance_session_id = a.attendance_session_id
         JOIN timetable t ON t.timetable_id = ases.timetable_id
         JOIN subject sub ON sub.subject_id = t.subject_id
         WHERE ${subjectConditions.join(" AND ")}
         GROUP BY sub.subject_id, sub.subject_code, sub.subject_name
         ORDER BY sub.subject_name`,
        subjectValues
    );

    const subjects = subjectsResult.rows.map((row) => {
        const present = Number(row.present);
        const total = Number(row.total);
        return {
            subjectId: row.subject_id,
            subjectCode: row.subject_code,
            subject: row.subject,
            present,
            total,
            percentage: total === 0 ? 0 : Number(((present / total) * 100).toFixed(2))
        };
    });

    return {
        studentId: resolvedStudentId,
        studentName: student?.student_name ?? null,
        batch: student?.batch ?? null,
        totalClasses,
        totalPresent,
        missedClasses: totalClasses - totalPresent,
        overallAttendance: totalClasses === 0 ? 0 : Number(((totalPresent / totalClasses) * 100).toFixed(2)),
        subjects
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

/**
 * facultyId scopes totalStudents/totalAttendanceRecords/averageAttendance/
 * pendingConflicts to this faculty member's own sessions — the figures
 * that would otherwise expose another faculty member's course data.
 * totalFaculty and activeDevices stay institution-wide even for a FACULTY
 * caller: an org-wide headcount/device count isn't another faculty
 * member's individual data the way a student list or conflict tied to
 * their specific class is.
 */
export const getSummaryReport = async (facultyId?: string | null) => {

    const facultyAttendanceJoin = facultyId
        ? `JOIN attendance_session ases ON ases.attendance_session_id = attendance.attendance_session_id
           JOIN timetable t ON t.timetable_id = ases.timetable_id`
        : "";
    const facultyAttendanceWhere = facultyId ? `AND t.faculty_id = $1` : "";

    const facultyConflictJoin = facultyId
        ? `JOIN attendance_session ases2 ON ases2.attendance_session_id = conflict.attendance_session_id
           JOIN timetable t2 ON t2.timetable_id = ases2.timetable_id`
        : "";
    const facultyConflictWhere = facultyId ? `AND t2.faculty_id = $1` : "";

    const studentCountQuery = facultyId
        ? `SELECT COUNT(DISTINCT s.student_id) FROM student s
           JOIN timetable t3 ON t3.batch_id = s.batch_id
           WHERE s.is_active = TRUE AND t3.faculty_id = $1`
        : `SELECT COUNT(*) FROM student WHERE is_active = TRUE`;

    const [students, faculty, attendance, devices, conflicts] = await Promise.all([
        pool.query(studentCountQuery, facultyId ? [facultyId] : []),
        pool.query(`SELECT COUNT(*) FROM faculty WHERE is_active = TRUE`),
        pool.query(
            `SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present
             FROM attendance
             ${facultyAttendanceJoin}
             WHERE attendance.is_active = TRUE ${facultyAttendanceWhere}`,
            facultyId ? [facultyId] : []
        ),
        pool.query(`SELECT COUNT(*) FROM device WHERE device_status = 'ACTIVE' AND is_active = TRUE`),
        pool.query(
            `SELECT COUNT(*) FROM conflict
             ${facultyConflictJoin}
             WHERE conflict.conflict_status = 'PENDING' AND conflict.is_active = TRUE ${facultyConflictWhere}`,
            facultyId ? [facultyId] : []
        )
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

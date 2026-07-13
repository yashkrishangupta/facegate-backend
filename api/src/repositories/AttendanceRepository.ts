import pool from "../config/database";

/**
 * Attendance Repository
 * Backed by the `attendance` table (unique on attendance_session_id + student_id).
 */

const SELECT_ATTENDANCE = `
    SELECT
        a.attendance_id,
        a.attendance_session_id AS session_id,
        a.student_id,
        s.first_name || ' ' || s.last_name AS student_name,
        a.device_id,
        a.attendance_status AS status,
        a.attendance_mode,
        a.recognition_confidence AS confidence,
        a.attendance_time AS timestamp,
        a.remarks,
        a.verification_status,
        a.synced,
        a.is_active
    FROM attendance a
    JOIN student s ON s.student_id = a.student_id
`;

/**
 * Manual attendance — an admin/faculty marking a whole session at once from
 * the website, distinct from markAttendance (device, single record).
 * Resolves/creates the attendance_session from (timetable_id, session_date)
 * the same way the device sync path does — the website has no separate way
 * to create a session, so requiring a pre-existing session_id here would
 * make this endpoint uncallable for a period nobody has synced yet.
 */
export const markAttendanceManual = async (
    timetableId: string,
    sessionDate: string,
    records: { student_id: string; status: string }[]
) => {
    const client = await pool.connect();
    let marked = 0;
    try {
        await client.query("BEGIN");

        const inserted = await client.query(
            `INSERT INTO attendance_session
                (attendance_session_id, timetable_id, session_date, start_time, end_time, session_status)
             SELECT gen_random_uuid(), t.timetable_id, $2, t.start_time, t.end_time, 'ACTIVE'
             FROM timetable t
             WHERE t.timetable_id = $1
             ON CONFLICT ON CONSTRAINT uq_session_per_day DO NOTHING
             RETURNING attendance_session_id`,
            [timetableId, sessionDate]
        );
        const sessionId = inserted.rows[0]?.attendance_session_id
            ?? (await client.query(
                `SELECT attendance_session_id FROM attendance_session
                 WHERE timetable_id = $1 AND session_date = $2`,
                [timetableId, sessionDate]
            )).rows[0]?.attendance_session_id;

        if (!sessionId) throw new Error("Could not resolve a session for this timetable/date");

        for (const r of records) {
            await client.query(
                `INSERT INTO attendance
                    (attendance_session_id, student_id, attendance_status,
                     attendance_mode, attendance_time, synced)
                 VALUES ($1, $2, $3, 'MANUAL', CURRENT_TIMESTAMP, TRUE)
                 ON CONFLICT ON CONSTRAINT uq_student_session
                 DO UPDATE SET
                    attendance_status = EXCLUDED.attendance_status,
                    attendance_mode = 'MANUAL',
                    attendance_time = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP`,
                [sessionId, r.student_id, r.status || "PRESENT"]
            );
            marked++;
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
    return { marked };
};

export const markAttendance = async (attendanceData: any) => {

    const {
        session_id,
        student_id,
        device_id,
        status,
        attendance_mode,
        confidence,
        remarks
    } = attendanceData;

    // Upsert on the natural key (session_id, student_id) — makes retries
    // from an offline device safe, per the sync protocol design.
    const result = await pool.query(
        `INSERT INTO attendance
            (attendance_session_id, student_id, device_id, attendance_status,
             attendance_mode, recognition_confidence, attendance_time, remarks, synced)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, TRUE)
         ON CONFLICT ON CONSTRAINT uq_student_session
         DO UPDATE SET
            attendance_status = EXCLUDED.attendance_status,
            attendance_mode = EXCLUDED.attendance_mode,
            recognition_confidence = EXCLUDED.recognition_confidence,
            attendance_time = EXCLUDED.attendance_time,
            remarks = EXCLUDED.remarks,
            synced = TRUE,
            synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
            session_id,
            student_id,
            device_id ?? null,
            status ?? "PRESENT",
            attendance_mode ?? "FACE_RECOGNITION",
            confidence ?? null,
            remarks ?? null
        ]
    );

    return result.rows[0];
};

export const getAttendanceBySession = async (sessionId: string, facultyId?: string | null) => {
    const values: any[] = [sessionId];
    let facultyClause = "";
    if (facultyId) {
        values.push(facultyId);
        facultyClause = `AND EXISTS (
            SELECT 1 FROM attendance_session ases
            JOIN timetable t ON t.timetable_id = ases.timetable_id
            WHERE ases.attendance_session_id = a.attendance_session_id
              AND t.faculty_id = $${values.length}
        )`;
    }
    const result = await pool.query(
        `${SELECT_ATTENDANCE} WHERE a.attendance_session_id = $1 AND a.is_active = TRUE ${facultyClause}
         ORDER BY a.attendance_time`,
        values
    );
    return result.rows;
};

export const getAttendanceByStudent = async (studentId: string, facultyId?: string | null) => {
    const values: any[] = [studentId];
    let facultyClause = "";
    if (facultyId) {
        values.push(facultyId);
        facultyClause = `AND EXISTS (
            SELECT 1 FROM attendance_session ases
            JOIN timetable t ON t.timetable_id = ases.timetable_id
            WHERE ases.attendance_session_id = a.attendance_session_id
              AND t.faculty_id = $${values.length}
        )`;
    }
    const result = await pool.query(
        `${SELECT_ATTENDANCE} WHERE a.student_id = $1 AND a.is_active = TRUE ${facultyClause}
         ORDER BY a.attendance_time DESC`,
        values
    );
    return result.rows;
};

export const updateAttendance = async (
    attendanceId: string,
    attendanceData: any
) => {

    const allowedFields = [
        "attendance_status", "attendance_mode", "recognition_confidence",
        "remarks", "verification_status"
    ];

    // Map the mock repo's flatter field names (status, confidence) onto the
    // real columns, on top of accepting the real column names directly.
    const fieldMap: Record<string, string> = {
        status: "attendance_status",
        confidence: "recognition_confidence"
    };

    const normalized: Record<string, any> = {};
    for (const key of Object.keys(attendanceData)) {
        const column = fieldMap[key] ?? key;
        if (allowedFields.includes(column)) {
            normalized[column] = attendanceData[key];
        }
    }

    const fields = Object.keys(normalized);

    if (fields.length === 0) {
        const result = await pool.query(
            `${SELECT_ATTENDANCE} WHERE a.attendance_id = $1`,
            [attendanceId]
        );
        return result.rows[0] || null;
    }

    const setClause = fields
        .map((field, i) => `${field} = $${i + 2}`)
        .join(", ");

    const values = fields.map(f => normalized[f]);

    const result = await pool.query(
        `UPDATE attendance
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE attendance_id = $1
         RETURNING *`,
        [attendanceId, ...values]
    );

    return result.rows[0] || null;
};

export const deleteAttendance = async (attendanceId: string) => {
    const result = await pool.query(
        `UPDATE attendance SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE attendance_id = $1
         RETURNING attendance_id`,
        [attendanceId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

export const getAttendanceSummary = async (sessionId: string) => {

    const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present,
            COUNT(*) FILTER (WHERE attendance_status = 'ABSENT') AS absent,
            COUNT(*) AS total
         FROM attendance
         WHERE attendance_session_id = $1 AND is_active = TRUE`,
        [sessionId]
    );

    const row = result.rows[0];
    const total = Number(row.total);
    const present = Number(row.present);
    const absent = Number(row.absent);

    return {
        sessionId,
        totalStudents: total,
        present,
        absent,
        attendancePercentage: total === 0 ? 0 : Number(((present / total) * 100).toFixed(2))
    };
};

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

export const getAttendanceBySession = async (sessionId: string) => {
    const result = await pool.query(
        `${SELECT_ATTENDANCE} WHERE a.attendance_session_id = $1 AND a.is_active = TRUE
         ORDER BY a.attendance_time`,
        [sessionId]
    );
    return result.rows;
};

export const getAttendanceByStudent = async (studentId: string) => {
    const result = await pool.query(
        `${SELECT_ATTENDANCE} WHERE a.student_id = $1 AND a.is_active = TRUE
         ORDER BY a.attendance_time DESC`,
        [studentId]
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

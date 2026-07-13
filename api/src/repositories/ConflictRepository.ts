import pool from "../config/database";

/**
 * Conflict Repository
 * Backed by the `conflict` table (ambiguous face matches / sync issues
 * flagged for admin review).
 */

const SELECT_CONFLICT = `
    SELECT
        c.conflict_id,
        c.attendance_id,
        c.attendance_session_id AS session_id,
        c.student_id,
        s.first_name || ' ' || s.last_name AS student_name,
        c.device_id,
        dv.device_name,
        dv.room_id,
        r.room_number,
        c.conflict_type,
        c.severity,
        c.conflict_status AS status,
        c.description,
        c.resolution_notes AS resolution,
        c.resolved_by,
        c.resolved_at,
        c.created_at,
        c.is_active
    FROM conflict c
    LEFT JOIN student s ON s.student_id = c.student_id
    LEFT JOIN device dv ON dv.device_id = c.device_id
    LEFT JOIN room r ON r.room_id = dv.room_id
`;

export const getAllConflicts = async () => {
    const result = await pool.query(
        `${SELECT_CONFLICT} WHERE c.is_active = TRUE ORDER BY c.created_at DESC`
    );
    return result.rows;
};

/**
 * Filtered list — backs the Conflict Queue's status / severity / type /
 * room / date-range filter row.
 */
export const getFilteredConflicts = async (filters: {
    status?: string;
    severity?: string;
    conflict_type?: string;
    room_id?: string;
    from_date?: string;
    to_date?: string;
    faculty_id?: string | null;
}) => {
    const conditions = ["c.is_active = TRUE"];
    const values: any[] = [];

    if (filters.status) { values.push(filters.status); conditions.push(`c.conflict_status = $${values.length}`); }
    if (filters.severity) { values.push(filters.severity); conditions.push(`c.severity = $${values.length}`); }
    if (filters.conflict_type) { values.push(filters.conflict_type); conditions.push(`c.conflict_type = $${values.length}`); }
    if (filters.room_id) { values.push(filters.room_id); conditions.push(`dv.room_id = $${values.length}`); }
    if (filters.from_date) { values.push(filters.from_date); conditions.push(`c.created_at >= $${values.length}`); }
    if (filters.to_date) { values.push(filters.to_date); conditions.push(`c.created_at <= $${values.length}`); }
    // FACULTY-role callers only ever see conflicts tied to sessions they teach.
    if (filters.faculty_id) {
        values.push(filters.faculty_id);
        conditions.push(`EXISTS (
            SELECT 1 FROM attendance_session ases
            JOIN timetable t ON t.timetable_id = ases.timetable_id
            WHERE ases.attendance_session_id = c.attendance_session_id
              AND t.faculty_id = $${values.length}
        )`);
    }

    const result = await pool.query(
        `${SELECT_CONFLICT} WHERE ${conditions.join(" AND ")} ORDER BY c.created_at DESC`,
        values
    );
    return result.rows;
};

export const getConflictById = async (conflictId: string) => {
    const result = await pool.query(
        `${SELECT_CONFLICT} WHERE c.conflict_id = $1`,
        [conflictId]
    );
    return result.rows[0];
};

export const createConflict = async (conflictData: any) => {

    const {
        attendance_id,
        session_id,
        student_id,
        device_id,
        conflict_type,
        severity,
        description
    } = conflictData;

    const result = await pool.query(
        `INSERT INTO conflict
            (attendance_id, attendance_session_id, student_id, device_id,
             conflict_type, severity, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            attendance_id ?? null,
            session_id,
            student_id ?? null,
            device_id ?? null,
            conflict_type,
            severity ?? "MEDIUM",
            description ?? null
        ]
    );

    return result.rows[0];
};

export const resolveConflict = async (
    conflictId: string,
    resolutionData: any
) => {

    const result = await pool.query(
        `UPDATE conflict
         SET conflict_status = 'RESOLVED',
             resolved_by = $2,
             resolution_notes = $3,
             resolved_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE conflict_id = $1
         RETURNING *`,
        [
            conflictId,
            resolutionData.resolvedBy ?? resolutionData.resolved_by ?? null,
            resolutionData.resolution ?? resolutionData.resolution_notes ?? "Resolved"
        ]
    );

    return result.rows[0] || null;
};

export const deleteConflict = async (conflictId: string) => {
    const result = await pool.query(
        `UPDATE conflict SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE conflict_id = $1
         RETURNING conflict_id`,
        [conflictId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

/**
 * Direct status transition — UNDER_REVIEW or REJECTED, previously
 * unreachable through the UI (only PENDING and RESOLVED, via
 * resolveConflict above, were ever set anywhere).
 */
export const updateConflictStatus = async (
    conflictId: string,
    status: string,
    resolvedBy?: string | null,
    notes?: string
) => {
    const result = await pool.query(
        `UPDATE conflict
         SET conflict_status = $2,
             resolved_by = CASE WHEN $2 = 'REJECTED' THEN $3 ELSE resolved_by END,
             resolution_notes = COALESCE($4, resolution_notes),
             resolved_at = CASE WHEN $2 IN ('RESOLVED', 'REJECTED') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE conflict_id = $1
         RETURNING *`,
        [conflictId, status, resolvedBy ?? null, notes ?? null]
    );
    return result.rows[0] || null;
};

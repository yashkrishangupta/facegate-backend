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
`;

export const getAllConflicts = async () => {
    const result = await pool.query(
        `${SELECT_CONFLICT} WHERE c.is_active = TRUE ORDER BY c.created_at DESC`
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

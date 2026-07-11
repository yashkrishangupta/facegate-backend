import pool from "../config/database";

/**
 * Batch Repository
 *
 * NEW — like Room before it, `batch` had a table and nothing else: no
 * route/controller ever created or listed one. Students, timetable, and
 * the new filter UI all need to pick a real batch, so this closes that gap.
 */

const SELECT_BATCH = `
    SELECT
        b.batch_id, b.department_id, d.department_name, b.batch_code,
        b.program_id, p.program_code, p.program_name,
        b.academic_year, b.semester, b.section, b.strength,
        b.batch_advisor_id,
        f.first_name || ' ' || f.last_name AS advisor_name,
        b.is_active, b.created_at, b.updated_at
    FROM batch b
    JOIN department d ON d.department_id = b.department_id
    JOIN program p ON p.program_id = b.program_id
    LEFT JOIN faculty f ON f.faculty_id = b.batch_advisor_id
`;

export const getAllBatches = async (filters: {
    academic_year?: string;
    program_id?: string;
    semester?: string;
    department_id?: string;
}) => {
    const conditions = ["b.is_active = TRUE"];
    const values: any[] = [];

    if (filters.academic_year) { values.push(filters.academic_year); conditions.push(`b.academic_year = $${values.length}`); }
    if (filters.program_id) { values.push(filters.program_id); conditions.push(`b.program_id = $${values.length}`); }
    if (filters.semester) { values.push(filters.semester); conditions.push(`b.semester = $${values.length}`); }
    if (filters.department_id) { values.push(filters.department_id); conditions.push(`b.department_id = $${values.length}`); }

    const result = await pool.query(
        `${SELECT_BATCH} WHERE ${conditions.join(" AND ")} ORDER BY b.academic_year DESC, b.batch_code`,
        values
    );
    return result.rows;
};

export const getBatchById = async (batchId: string) => {
    const result = await pool.query(`${SELECT_BATCH} WHERE b.batch_id = $1`, [batchId]);
    return result.rows[0];
};

export const createBatch = async (data: any) => {
    const { department_id, batch_code, program_id, academic_year, semester, section, strength, batch_advisor_id } = data;
    const result = await pool.query(
        `INSERT INTO batch
            (department_id, batch_code, program_id, academic_year, semester, section, strength, batch_advisor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [department_id, batch_code, program_id, academic_year, semester, section ?? null, strength ?? null, batch_advisor_id ?? null]
    );
    return result.rows[0];
};

export const updateBatch = async (batchId: string, data: any) => {
    const allowed = ["department_id", "batch_code", "program_id", "academic_year", "semester", "section", "strength", "batch_advisor_id"];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return getBatchById(batchId);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => data[f]);
    const result = await pool.query(
        `UPDATE batch SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE batch_id = $1 RETURNING *`,
        [batchId, ...values]
    );
    return result.rows[0];
};

export const deactivateBatch = async (batchId: string) => {
    const result = await pool.query(
        `UPDATE batch SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE batch_id = $1 RETURNING batch_id`,
        [batchId]
    );
    return { success: (result.rowCount ?? 0) > 0 };
};

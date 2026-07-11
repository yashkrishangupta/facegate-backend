import pool from "../config/database";

/**
 * Program Repository
 *
 * NEW — "program" was previously just a hardcoded VARCHAR + CHECK list
 * duplicated on both `batch` and `subject` (B.Tech/M.Tech/PhD/MBA/MCA).
 * Now a real master-data table; batch and subject both FK into it.
 */

const SELECT_PROGRAM = `
    SELECT program_id, program_code, program_name, degree_type,
           duration_years, is_active, created_at, updated_at
    FROM program
`;

export const getAllPrograms = async () => {
    const result = await pool.query(`${SELECT_PROGRAM} WHERE is_active = TRUE ORDER BY program_name`);
    return result.rows;
};

export const getProgramById = async (programId: string) => {
    const result = await pool.query(`${SELECT_PROGRAM} WHERE program_id = $1`, [programId]);
    return result.rows[0];
};

export const createProgram = async (data: any) => {
    const { program_code, program_name, degree_type, duration_years } = data;
    const result = await pool.query(
        `INSERT INTO program (program_code, program_name, degree_type, duration_years)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [program_code, program_name, degree_type, duration_years]
    );
    return result.rows[0];
};

export const updateProgram = async (programId: string, data: any) => {
    const allowed = ["program_code", "program_name", "degree_type", "duration_years"];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return getProgramById(programId);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => data[f]);
    const result = await pool.query(
        `UPDATE program SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE program_id = $1 RETURNING *`,
        [programId, ...values]
    );
    return result.rows[0];
};

export const deactivateProgram = async (programId: string) => {
    const result = await pool.query(
        `UPDATE program SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE program_id = $1 RETURNING program_id`,
        [programId]
    );
    return { success: (result.rowCount ?? 0) > 0 };
};

import pool from "../config/database";

const SELECT_SUBJECT = `
    SELECT s.subject_id, s.department_id, d.department_name, s.subject_code,
           s.subject_name, s.program_id, p.program_code, p.program_name,
           s.semester, s.credits, s.subject_type,
           s.course_category, s.contact_hours_per_week, s.description,
           s.is_active, s.created_at, s.updated_at
    FROM subject s
    JOIN department d ON d.department_id = s.department_id
    JOIN program p ON p.program_id = s.program_id
`;

export const getAllSubjects = async (filters: { program_id?: string; semester?: string; department_id?: string }) => {
    const conditions = ["s.is_active = TRUE"];
    const values: any[] = [];
    if (filters.program_id) { values.push(filters.program_id); conditions.push(`s.program_id = $${values.length}`); }
    if (filters.semester) { values.push(filters.semester); conditions.push(`s.semester = $${values.length}`); }
    if (filters.department_id) { values.push(filters.department_id); conditions.push(`s.department_id = $${values.length}`); }
    const result = await pool.query(
        `${SELECT_SUBJECT} WHERE ${conditions.join(" AND ")} ORDER BY s.subject_code`,
        values
    );
    return result.rows;
};

export const getSubjectById = async (subjectId: string) => {
    const result = await pool.query(`${SELECT_SUBJECT} WHERE s.subject_id = $1`, [subjectId]);
    return result.rows[0];
};

export const createSubject = async (data: any) => {
    const {
        department_id, subject_code, subject_name, program_id, semester,
        credits, subject_type, course_category, contact_hours_per_week, description
    } = data;
    const result = await pool.query(
        `INSERT INTO subject
            (department_id, subject_code, subject_name, program_id, semester,
             credits, subject_type, course_category, contact_hours_per_week, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
            department_id, subject_code, subject_name, program_id, semester,
            credits, subject_type, course_category ?? "Core", contact_hours_per_week,
            description ?? null
        ]
    );
    return result.rows[0];
};

export const updateSubject = async (subjectId: string, data: any) => {
    const allowed = [
        "department_id", "subject_code", "subject_name", "program_id", "semester",
        "credits", "subject_type", "course_category", "contact_hours_per_week", "description"
    ];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return getSubjectById(subjectId);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => data[f]);
    const result = await pool.query(
        `UPDATE subject SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE subject_id = $1 RETURNING *`,
        [subjectId, ...values]
    );
    return result.rows[0];
};

export const deactivateSubject = async (subjectId: string) => {
    const result = await pool.query(
        `UPDATE subject SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE subject_id = $1 RETURNING subject_id`,
        [subjectId]
    );
    return { success: (result.rowCount ?? 0) > 0 };
};

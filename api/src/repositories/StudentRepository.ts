import pool from "../config/database";

/**
 * Student Repository
 * Backed by the `student` table, joined with `batch` and `department`
 * for convenience fields (batch_code, semester, department_name).
 */

const SELECT_STUDENT = `
    SELECT
        s.student_id,
        s.batch_id,
        s.registration_number,
        s.roll_number,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.gender,
        s.date_of_birth,
        s.admission_year,
        s.profile_photo_url,
        s.student_status,
        s.is_active,
        b.batch_code,
        b.academic_year,
        b.program_id,
        p.program_name AS program,
        b.semester,
        b.section,
        b.department_id,
        d.department_name AS department
    FROM student s
    JOIN batch b ON b.batch_id = s.batch_id
    JOIN program p ON p.program_id = b.program_id
    JOIN department d ON d.department_id = b.department_id
`;

export const getAllStudents = async () => {
    const result = await pool.query(
        `${SELECT_STUDENT} WHERE s.is_active = TRUE ORDER BY s.first_name`
    );
    return result.rows;
};

/**
 * Filtered list — backs the Students page's Academic Year / Program /
 * Semester / Batch filter row. All filters are optional and AND together.
 */
export const getFilteredStudents = async (filters: {
    academic_year?: string;
    program_id?: string;
    semester?: string;
    batch_id?: string;
    department_id?: string;
}) => {
    const conditions = ["s.is_active = TRUE"];
    const values: any[] = [];

    if (filters.academic_year) { values.push(filters.academic_year); conditions.push(`b.academic_year = $${values.length}`); }
    if (filters.program_id) { values.push(filters.program_id); conditions.push(`b.program_id = $${values.length}`); }
    if (filters.semester) { values.push(filters.semester); conditions.push(`b.semester = $${values.length}`); }
    if (filters.batch_id) { values.push(filters.batch_id); conditions.push(`s.batch_id = $${values.length}`); }
    if (filters.department_id) { values.push(filters.department_id); conditions.push(`b.department_id = $${values.length}`); }

    const result = await pool.query(
        `${SELECT_STUDENT} WHERE ${conditions.join(" AND ")} ORDER BY s.first_name`,
        values
    );
    return result.rows;
};

export const getStudentById = async (studentId: string) => {
    const result = await pool.query(
        `${SELECT_STUDENT} WHERE s.student_id = $1`,
        [studentId]
    );
    return result.rows[0];
};

export const getStudentsByBatch = async (batchId: string) => {
    const result = await pool.query(
        `${SELECT_STUDENT} WHERE s.batch_id = $1 AND s.is_active = TRUE ORDER BY s.first_name`,
        [batchId]
    );
    return result.rows;
};

export const createStudent = async (studentData: any) => {

    const {
        batch_id,
        registration_number,
        roll_number,
        first_name,
        last_name,
        email,
        phone,
        gender,
        date_of_birth,
        admission_year,
        profile_photo_url
    } = studentData;

    const result = await pool.query(
        `INSERT INTO student
            (batch_id, registration_number, roll_number, first_name, last_name,
             email, phone, gender, date_of_birth, admission_year, profile_photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
            batch_id,
            registration_number,
            roll_number,
            first_name,
            last_name,
            email || null,
            phone ?? null,
            gender,
            date_of_birth ?? null,
            admission_year,
            profile_photo_url ?? null
        ]
    );

    return result.rows[0];
};

export const updateStudent = async (
    studentId: string,
    studentData: any
) => {

    // Only allow known, updatable columns through — avoids SQL injection via
    // arbitrary object keys and avoids accidentally overwriting student_id.
    const allowedFields = [
        "batch_id", "registration_number", "roll_number", "first_name",
        "last_name", "email", "phone", "gender", "date_of_birth",
        "admission_year", "profile_photo_url", "student_status"
    ];

    const fields = Object.keys(studentData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getStudentById(studentId);
    }

    const setClause = fields
        .map((field, i) => `${field} = $${i + 2}`)
        .join(", ");

    const values = fields.map(f => studentData[f]);

    const result = await pool.query(
        `UPDATE student
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $1
         RETURNING *`,
        [studentId, ...values]
    );

    return result.rows[0] || null;
};

export const deleteStudent = async (studentId: string) => {

    // Soft delete — matches the is_active pattern used across the schema,
    // and preserves attendance/embedding history tied to this student.
    const result = await pool.query(
        `UPDATE student SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $1
         RETURNING student_id`,
        [studentId]
    );

    return { success: result.rowCount !== null && result.rowCount > 0 };
};

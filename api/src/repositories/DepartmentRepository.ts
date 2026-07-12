import pool from "../config/database";

const SELECT_DEPARTMENT = `
    SELECT department_id, department_code, department_name, hod_name,
           email, phone, is_active, created_at, updated_at
    FROM department
`;

export const getAllDepartments = async () => {
    const result = await pool.query(`${SELECT_DEPARTMENT} WHERE is_active = TRUE ORDER BY department_name`);
    return result.rows;
};

export const getDepartmentById = async (departmentId: string) => {
    const result = await pool.query(`${SELECT_DEPARTMENT} WHERE department_id = $1`, [departmentId]);
    return result.rows[0];
};

export const createDepartment = async (data: any) => {
    const { department_code, department_name, hod_name, email, phone } = data;
    // Empty string is NOT the same as omitted — `email: ''` would fail
    // chk_department_email (which only allows NULL or a valid regex match,
    // not an empty string), so blank optional fields need to become NULL,
    // not pass through as ''.
    const result = await pool.query(
        `INSERT INTO department (department_code, department_name, hod_name, email, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [department_code, department_name, hod_name || null, email || null, phone || null]
    );
    return result.rows[0];
};

export const updateDepartment = async (departmentId: string, data: any) => {
    const allowed = ["department_code", "department_name", "hod_name", "email", "phone"];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return getDepartmentById(departmentId);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => data[f]);
    const result = await pool.query(
        `UPDATE department SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE department_id = $1 RETURNING *`,
        [departmentId, ...values]
    );
    return result.rows[0];
};

export const deactivateDepartment = async (departmentId: string) => {
    const result = await pool.query(
        `UPDATE department SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE department_id = $1 RETURNING department_id`,
        [departmentId]
    );
    return { success: (result.rowCount ?? 0) > 0 };
};

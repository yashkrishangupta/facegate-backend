import bcrypt from "bcryptjs";
import pool from "../config/database";

/**
 * Faculty Repository
 *
 * Creating a faculty record also provisions its login account in the same
 * transaction: a username is generated from the name (deduped with a
 * trailing number on collision), and the password the admin typed into the
 * form is hashed before it ever touches the DB. See createFacultyWithAccount.
 */

const SELECT_FACULTY = `
    SELECT
        f.faculty_id, f.department_id, d.department_name, f.employee_id,
        f.first_name, f.last_name, f.email, f.phone, f.designation,
        f.specialization, f.joining_date, f.office_location, f.is_active,
        au.admin_id, au.username, au.account_status
    FROM faculty f
    JOIN department d ON d.department_id = f.department_id
    LEFT JOIN admin_user au ON au.faculty_id = f.faculty_id
`;

const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z]+/g, "");

/**
 * "Amit Sharma" -> amit.sharma, amit.sharma2, amit.sharma3, ... on collision.
 */
const generateUsername = async (firstName: string, lastName: string): Promise<string> => {

    const base = `${slugify(firstName)}.${slugify(lastName)}`;

    const existing = await pool.query(
        `SELECT username FROM admin_user WHERE username = $1 OR username LIKE $2`,
        [base, `${base}%`]
    );

    if (existing.rows.length === 0) {
        return base;
    }

    const takenSuffixes = new Set(
        existing.rows.map((r: any) => r.username as string)
    );

    if (!takenSuffixes.has(base)) {
        return base;
    }

    let n = 2;
    while (takenSuffixes.has(`${base}${n}`)) {
        n++;
    }
    return `${base}${n}`;
};

export const getAllFaculty = async () => {
    const result = await pool.query(
        `${SELECT_FACULTY} WHERE f.is_active = TRUE ORDER BY f.first_name`
    );
    return result.rows;
};

export const getFacultyById = async (facultyId: string) => {
    const result = await pool.query(
        `${SELECT_FACULTY} WHERE f.faculty_id = $1`,
        [facultyId]
    );
    return result.rows[0];
};

/**
 * Creates the faculty row AND its admin_user login row atomically — if
 * either insert fails, both roll back, so we never end up with a faculty
 * record that has no way to log in, or a login with no teaching record.
 */
export const createFacultyWithAccount = async (facultyData: any, password: string) => {

    const {
        department_id, employee_id, first_name, last_name, email, phone,
        designation, specialization, joining_date, office_location
    } = facultyData;

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const facultyResult = await client.query(
            `INSERT INTO faculty
                (department_id, employee_id, first_name, last_name, email,
                 phone, designation, specialization, joining_date, office_location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                department_id, employee_id, first_name, last_name, email,
                phone ?? null, designation, specialization ?? null,
                joining_date ?? null, office_location ?? null
            ]
        );

        const faculty = facultyResult.rows[0];

        const username = await generateUsername(first_name, last_name);
        const passwordHash = await bcrypt.hash(password, 10);

        const adminResult = await client.query(
            `INSERT INTO admin_user
                (employee_id, username, faculty_id, first_name, last_name,
                 email, password_hash, role, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'FACULTY', $8)
             RETURNING admin_id, username`,
            [
                employee_id, username, faculty.faculty_id, first_name,
                last_name, email, passwordHash, phone ?? null
            ]
        );

        await client.query("COMMIT");

        return {
            faculty,
            account: {
                adminId: adminResult.rows[0].admin_id,
                username: adminResult.rows[0].username
            }
        };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

export const updateFaculty = async (facultyId: string, facultyData: any) => {

    const allowedFields = [
        "department_id", "first_name", "last_name", "email", "phone",
        "designation", "specialization", "joining_date", "office_location"
    ];

    const fields = Object.keys(facultyData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getFacultyById(facultyId);
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
    const values = fields.map(f => facultyData[f]);

    const result = await pool.query(
        `UPDATE faculty
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE faculty_id = $1
         RETURNING *`,
        [facultyId, ...values]
    );

    // Keep the linked login's name/email/phone in sync, since faculty and
    // admin_user duplicate those fields by design (admin_user needs them
    // even for non-faculty roles).
    if (result.rows[0]) {
        await pool.query(
            `UPDATE admin_user
             SET first_name = $2, last_name = $3, email = $4, phone = $5,
                 updated_at = CURRENT_TIMESTAMP
             WHERE faculty_id = $1`,
            [
                facultyId,
                result.rows[0].first_name,
                result.rows[0].last_name,
                result.rows[0].email,
                result.rows[0].phone
            ]
        );
    }

    return result.rows[0];
};

export const deactivateFaculty = async (facultyId: string) => {

    await pool.query(
        `UPDATE faculty SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE faculty_id = $1`,
        [facultyId]
    );

    // Also lock the linked login out — a deactivated faculty member
    // shouldn't still be able to sign in.
    const result = await pool.query(
        `UPDATE admin_user SET account_status = 'DISABLED', updated_at = CURRENT_TIMESTAMP
         WHERE faculty_id = $1
         RETURNING admin_id`,
        [facultyId]
    );

    return { success: true, accountDisabled: result.rowCount !== null && result.rowCount > 0 };
};

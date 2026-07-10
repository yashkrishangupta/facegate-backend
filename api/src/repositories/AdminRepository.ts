import bcrypt from "bcryptjs";
import pool from "../config/database";

/**
 * Admin Repository
 * Backed by the `admin_user` table. JWT issuance and route-level auth are
 * explicitly out of scope for this build (see architecture doc, Section 9) —
 * this repository only handles credential checking and profile CRUD, so it's
 * ready to plug into real auth middleware once that's added.
 */

const SELECT_ADMIN = `
    SELECT
        admin_id, employee_id, first_name, last_name, email, role,
        phone, last_login, account_status, is_active
    FROM admin_user
`;

export const login = async (loginData: any) => {

    const { email, password } = loginData;

    const result = await pool.query(
        `SELECT * FROM admin_user WHERE email = $1 AND is_active = TRUE`,
        [email]
    );

    const admin = result.rows[0];

    if (!admin) {
        return { success: false, message: "Invalid credentials" };
    }

    if (admin.account_status !== "ACTIVE") {
        return { success: false, message: "Account is disabled" };
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatches) {

        await pool.query(
            `UPDATE admin_user SET failed_login_attempts = failed_login_attempts + 1
             WHERE admin_id = $1`,
            [admin.admin_id]
        );

        return { success: false, message: "Invalid credentials" };
    }

    await pool.query(
        `UPDATE admin_user
         SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0
         WHERE admin_id = $1`,
        [admin.admin_id]
    );

    const { password_hash, ...safeAdmin } = admin;

    // NOTE: no JWT is issued here — per Section 9 of the architecture doc,
    // website login/auth is explicitly deferred to a later build. Swap this
    // for a real signed token once that work starts.
    return { success: true, admin: safeAdmin };
};

export const logout = async () => {
    return { success: true };
};

const resolveAdminId = async (adminId?: string): Promise<string | null> => {
    if (adminId) return adminId;
    const result = await pool.query(
        `SELECT admin_id FROM admin_user WHERE is_active = TRUE ORDER BY created_at LIMIT 1`
    );
    return result.rows[0]?.admin_id ?? null;
};

export const getProfile = async (adminId?: string) => {
    const id = await resolveAdminId(adminId);
    if (!id) return null;
    const result = await pool.query(
        `${SELECT_ADMIN} WHERE admin_id = $1`,
        [id]
    );
    return result.rows[0];
};

export const updateProfile = async (profileData: any, adminId?: string) => {

    const id = await resolveAdminId(adminId ?? profileData.adminId ?? profileData.admin_id);
    if (!id) return null;

    const allowedFields = ["first_name", "last_name", "phone"];
    const fields = Object.keys(profileData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getProfile(id);
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
    const values = fields.map(f => profileData[f]);

    const result = await pool.query(
        `UPDATE admin_user
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE admin_id = $1
         RETURNING admin_id, employee_id, first_name, last_name, email, role,
                   phone, last_login, account_status, is_active`,
        [id, ...values]
    );

    return result.rows[0] || null;
};

export const changePassword = async (passwordData: any, adminId?: string) => {

    const id = await resolveAdminId(adminId ?? passwordData.adminId ?? passwordData.admin_id);
    if (!id) return { success: false, message: "Admin not found" };

    const { currentPassword, newPassword } = passwordData;

    const result = await pool.query(
        `SELECT password_hash FROM admin_user WHERE admin_id = $1`,
        [id]
    );

    const admin = result.rows[0];

    if (!admin) {
        return { success: false, message: "Admin not found" };
    }

    const matches = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!matches) {
        return { success: false, message: "Current password is incorrect" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
        `UPDATE admin_user SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
         WHERE admin_id = $1`,
        [id, newHash]
    );

    return { success: true, message: "Password changed successfully" };
};

export const getAllAdmins = async () => {
    const result = await pool.query(
        `${SELECT_ADMIN} WHERE is_active = TRUE ORDER BY first_name`
    );
    return result.rows;
};

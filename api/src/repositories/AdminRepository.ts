import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env";

/**
 * Admin Repository
 *
 * Real login now exists (previous version explicitly deferred this per
 * architecture doc Section 9 — that decision has been reversed). Login is
 * by `username` (institutional email is still stored but not the login
 * key — faculty accounts are provisioned with a generated username).
 */

const SELECT_ADMIN = `
    SELECT
        admin_id, employee_id, username, faculty_id, first_name, last_name,
        email, role, phone, last_login, account_status, is_active
    FROM admin_user
`;

export const login = async (loginData: any) => {

    const { username, password } = loginData;

    const result = await pool.query(
        `SELECT * FROM admin_user WHERE username = $1 AND is_active = TRUE`,
        [username]
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

    const token = jwt.sign(
        { adminId: admin.admin_id, role: admin.role, facultyId: admin.faculty_id ?? null },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const { password_hash, ...safeAdmin } = admin;

    return { success: true, token, admin: safeAdmin };
};

export const logout = async () => {
    // Stateless JWT — nothing to invalidate server-side. Client just drops
    // the token. (A revocation list is future work if it's ever needed.)
    return { success: true };
};

export const getProfile = async (adminId: string) => {
    const result = await pool.query(
        `${SELECT_ADMIN} WHERE admin_id = $1`,
        [adminId]
    );
    return result.rows[0];
};

/**
 * Profile-only update — deliberately cannot touch role, account_status, or
 * password. Those live in updateSecurity (SUPER_ADMIN only) and
 * changePassword/resetPassword respectively, so an ADMIN calling this
 * endpoint has no path to escalating anyone's privileges.
 */
export const updateProfile = async (adminId: string, profileData: any) => {

    const allowedFields = ["first_name", "last_name", "phone", "email"];
    const fields = Object.keys(profileData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getProfile(adminId);
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
    const values = fields.map(f => profileData[f]);

    const result = await pool.query(
        `UPDATE admin_user
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE admin_id = $1
         RETURNING admin_id, employee_id, username, faculty_id, first_name,
                   last_name, email, role, phone, last_login, account_status, is_active`,
        [adminId, ...values]
    );

    return result.rows[0] || null;
};

/**
 * Self-service password change — requires the current password. This is
 * the ONLY password path available to non-SUPER_ADMIN users, including for
 * their own account.
 */
export const changePassword = async (adminId: string, passwordData: any) => {

    const { currentPassword, newPassword } = passwordData;

    const result = await pool.query(
        `SELECT password_hash FROM admin_user WHERE admin_id = $1`,
        [adminId]
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
        [adminId, newHash]
    );

    return { success: true, message: "Password changed successfully" };
};

/**
 * SUPER_ADMIN-only reset of ANOTHER user's password — no current password
 * needed, unlike changePassword above. Also where role/account_status
 * changes live, since those are equally security-sensitive.
 */
export const updateSecurity = async (targetAdminId: string, securityData: any) => {

    const { newPassword, role, account_status } = securityData;

    const updates: string[] = [];
    const values: any[] = [];
    let i = 2;

    if (newPassword) {
        const newHash = await bcrypt.hash(newPassword, 10);
        updates.push(`password_hash = $${i++}`);
        values.push(newHash);
    }
    if (role) {
        updates.push(`role = $${i++}`);
        values.push(role);
    }
    if (account_status) {
        updates.push(`account_status = $${i++}`);
        values.push(account_status);
        // A fresh ACTIVE status should give a locked-out account a clean
        // slate rather than instantly re-tripping any lockout logic.
        if (account_status === "ACTIVE") {
            updates.push(`failed_login_attempts = 0`);
        }
    }

    if (updates.length === 0) {
        return getProfile(targetAdminId);
    }

    const result = await pool.query(
        `UPDATE admin_user
         SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE admin_id = $1
         RETURNING admin_id, employee_id, username, faculty_id, first_name,
                   last_name, email, role, phone, last_login, account_status, is_active`,
        [targetAdminId, ...values]
    );

    return result.rows[0] || null;
};

export const getAllAdmins = async () => {
    const result = await pool.query(
        `${SELECT_ADMIN} WHERE is_active = TRUE ORDER BY role, first_name`
    );
    return result.rows;
};

export const getAdminById = async (adminId: string) => {
    const result = await pool.query(
        `${SELECT_ADMIN} WHERE admin_id = $1`,
        [adminId]
    );
    return result.rows[0];
};

export const deactivateAdmin = async (adminId: string) => {
    const result = await pool.query(
        `UPDATE admin_user SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE admin_id = $1
         RETURNING admin_id`,
        [adminId]
    );
    return { success: (result.rowCount ?? 0) > 0 };
};

const slugifyUsername = (value: string) => value.toLowerCase().trim().replace(/[^a-z]+/g, "");

const generateAdminUsername = async (firstName: string, lastName: string): Promise<string> => {
    const base = `${slugifyUsername(firstName)}.${slugifyUsername(lastName)}`;
    const existing = await pool.query(
        `SELECT username FROM admin_user WHERE username = $1 OR username LIKE $2`,
        [base, `${base}%`]
    );
    if (existing.rows.length === 0) return base;
    const taken = new Set(existing.rows.map((r: any) => r.username as string));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}${n}`)) n++;
    return `${base}${n}`;
};

/**
 * Create a plain admin account directly — SUPER_ADMIN only. Previously the
 * only way an admin_user row could be created was via Faculty (always
 * role='FACULTY') or the one-time SQL bootstrap script; there was no path
 * to a standalone ADMIN/SUPER_ADMIN/VIEWER account at all.
 */
export const createAdmin = async (data: any) => {
    const { employee_id, first_name, last_name, email, phone, role, password } = data;

    const username = await generateAdminUsername(first_name, last_name);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO admin_user
            (employee_id, username, first_name, last_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING admin_id, employee_id, username, first_name, last_name, email, role, account_status`,
        [employee_id, username, first_name, last_name, email, phone ?? null, passwordHash, role]
    );

    return result.rows[0];
};

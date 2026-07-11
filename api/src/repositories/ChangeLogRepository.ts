import pool from "../config/database";

/**
 * Change Log Repository
 *
 * The `change_log` table existed in schema.sql from the start, but nothing
 * in the codebase ever wrote to it — the "audit trail" was permanently
 * empty. `recordChange` is the write-hook other controllers now call;
 * `getAllChanges` is what the new Change Log page reads.
 */

export const recordChange = async (
    adminId: string | null,
    entityName: string,
    entityId: string | null,
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "SYNC" | "RESOLVE" | "EXPORT",
    oldValues?: any,
    newValues?: any
) => {
    try {
        await pool.query(
            `INSERT INTO change_log
                (admin_id, entity_name, entity_id, action, old_values, new_values)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                adminId,
                entityName,
                entityId,
                action,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null
            ]
        );
    } catch (err) {
        // Never let a logging failure break the actual operation it's
        // describing — log to console and move on.
        console.error("Failed to write change_log entry:", err);
    }
};

export const getAllChanges = async (filters: {
    entity_name?: string;
    action?: string;
    admin_id?: string;
    from_date?: string;
    to_date?: string;
}) => {

    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.entity_name) { values.push(filters.entity_name); conditions.push(`cl.entity_name = $${values.length}`); }
    if (filters.action) { values.push(filters.action); conditions.push(`cl.action = $${values.length}`); }
    if (filters.admin_id) { values.push(filters.admin_id); conditions.push(`cl.admin_id = $${values.length}`); }
    if (filters.from_date) { values.push(filters.from_date); conditions.push(`cl.action_timestamp >= $${values.length}`); }
    if (filters.to_date) { values.push(filters.to_date); conditions.push(`cl.action_timestamp <= $${values.length}`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
        `SELECT cl.change_log_id, cl.entity_name, cl.entity_id, cl.action,
                cl.old_values, cl.new_values, cl.action_timestamp,
                au.first_name, au.last_name, au.username
         FROM change_log cl
         LEFT JOIN admin_user au ON au.admin_id = cl.admin_id
         ${whereClause}
         ORDER BY cl.action_timestamp DESC
         LIMIT 500`,
        values
    );

    return result.rows;
};

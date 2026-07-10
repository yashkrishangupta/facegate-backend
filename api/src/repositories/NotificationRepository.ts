import pool from "../config/database";

/**
 * Notification Repository
 * Backed directly by the `notification` table.
 */

const SELECT_NOTIFICATION = `
    SELECT
        notification_id,
        admin_id,
        title,
        message,
        notification_type AS type,
        priority,
        is_read,
        read_at,
        created_by,
        created_at,
        is_active
    FROM notification
`;

export const getAllNotifications = async () => {
    const result = await pool.query(
        `${SELECT_NOTIFICATION} WHERE is_active = TRUE ORDER BY created_at DESC`
    );
    return result.rows;
};

export const getNotificationById = async (notificationId: string) => {
    const result = await pool.query(
        `${SELECT_NOTIFICATION} WHERE notification_id = $1`,
        [notificationId]
    );
    return result.rows[0];
};

export const createNotification = async (notificationData: any) => {

    const { admin_id, title, message, type, priority, created_by } = notificationData;

    const result = await pool.query(
        `INSERT INTO notification
            (admin_id, title, message, notification_type, priority, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING notification_id, admin_id, title, message,
                   notification_type AS type, priority, is_read, read_at,
                   created_by, created_at, is_active`,
        [
            admin_id ?? null,
            title,
            message,
            type ?? notificationData.notification_type,
            priority ?? "MEDIUM",
            created_by ?? null
        ]
    );

    return result.rows[0];
};

export const markAsRead = async (notificationId: string) => {
    const result = await pool.query(
        `UPDATE notification
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE notification_id = $1
         RETURNING notification_id, admin_id, title, message,
                   notification_type AS type, priority, is_read, read_at,
                   created_by, created_at, is_active`,
        [notificationId]
    );
    return result.rows[0] || null;
};

export const deleteNotification = async (notificationId: string) => {
    const result = await pool.query(
        `UPDATE notification SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE notification_id = $1
         RETURNING notification_id`,
        [notificationId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

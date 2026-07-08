import pool from "../config/database";

/**
 * Device Repository
 * Backed by the `device` table, joined with `room` for the room number.
 */

const SELECT_DEVICE = `
    SELECT
        dv.device_id,
        dv.device_identifier,
        dv.device_name,
        dv.device_type,
        dv.app_version,
        dv.operating_system,
        dv.registration_date,
        dv.last_heartbeat,
        dv.last_sync,
        dv.battery_percentage,
        dv.storage_available_mb,
        dv.network_status,
        dv.device_status,
        dv.is_active,
        r.room_id,
        r.room_number
    FROM device dv
    JOIN room r ON r.room_id = dv.room_id
`;

export const getAllDevices = async () => {
    const result = await pool.query(
        `${SELECT_DEVICE} WHERE dv.is_active = TRUE ORDER BY r.room_number`
    );
    return result.rows;
};

export const getDeviceById = async (deviceId: string) => {
    const result = await pool.query(
        `${SELECT_DEVICE} WHERE dv.device_id = $1`,
        [deviceId]
    );
    return result.rows[0];
};

export const registerDevice = async (deviceData: any) => {

    const {
        room_id,
        device_identifier,
        device_name,
        device_type,
        app_version,
        operating_system
    } = deviceData;

    if (!app_version) {
        throw new Error("app_version is required to register a device");
    }

    // device_token is a UUID column with DEFAULT gen_random_uuid() — let
    // Postgres generate it rather than producing our own format here.
    // It's only ever returned once, at registration time; the device must
    // store it locally as its x-api-key for every future sync call.
    const result = await pool.query(
        `INSERT INTO device
            (room_id, device_identifier, device_name, device_type,
             app_version, operating_system, device_status, network_status,
             registration_date)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 'ONLINE', CURRENT_TIMESTAMP)
         RETURNING *`,
        [
            room_id,
            device_identifier,
            device_name,
            device_type ?? "ANDROID_TABLET",
            app_version,
            operating_system ?? null
        ]
    );

    return result.rows[0];
};

export const updateDevice = async (
    deviceId: string,
    deviceData: any
) => {

    const allowedFields = [
        "room_id", "device_name", "device_type", "app_version",
        "operating_system", "device_status"
    ];

    const fields = Object.keys(deviceData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getDeviceById(deviceId);
    }

    const setClause = fields
        .map((field, i) => `${field} = $${i + 2}`)
        .join(", ");

    const values = fields.map(f => deviceData[f]);

    const result = await pool.query(
        `UPDATE device
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1
         RETURNING *`,
        [deviceId, ...values]
    );

    return result.rows[0] || null;
};

export const heartbeat = async (heartbeatData: any) => {

    const { deviceId, batteryLevel, storageAvailableMb, networkStatus } = heartbeatData;

    const result = await pool.query(
        `UPDATE device
         SET last_heartbeat = CURRENT_TIMESTAMP,
             device_status = 'ACTIVE',
             network_status = COALESCE($2, network_status),
             battery_percentage = COALESCE($3, battery_percentage),
             storage_available_mb = COALESCE($4, storage_available_mb)
         WHERE device_id = $1
         RETURNING *`,
        [deviceId, networkStatus ?? null, batteryLevel ?? null, storageAvailableMb ?? null]
    );

    if (result.rowCount === 0) {
        return { success: false, message: "Device not found" };
    }

    return { success: true, device: result.rows[0] };
};

export const getDeviceStatus = async () => {

    const totals = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE is_active = TRUE) AS total,
            COUNT(*) FILTER (WHERE device_status = 'ACTIVE' AND is_active = TRUE) AS online,
            COUNT(*) FILTER (WHERE device_status != 'ACTIVE' AND is_active = TRUE) AS offline
         FROM device`
    );

    const devices = await getAllDevices();

    const row = totals.rows[0];

    return {
        totalDevices: Number(row.total),
        onlineDevices: Number(row.online),
        offlineDevices: Number(row.offline),
        devices
    };
};
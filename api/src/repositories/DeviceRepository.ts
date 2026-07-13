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
        -- Only meaningful while device_status = 'PENDING_PAIRING'; NULL
        -- afterward. Shown so an admin can retrieve/re-share the code
        -- without regenerating it if they navigate away from the modal.
        dv.pairing_code,
        dv.pairing_code_expires_at,
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

/**
 * Is this room already claimed by a device that's active or mid-pairing?
 * Backs the architecture's "guard against two devices assigned the same
 * room" decision — checked before create AND before a reassignment.
 */
/**
 * Live health snapshot — device_sync_log has been written to on every
 * sync/pair call all along; this just reads it back.
 */
export const getDeviceHealth = async (deviceId: string) => {
    const deviceResult = await pool.query(
        `SELECT device_status, network_status, battery_percentage,
                storage_available_mb, last_heartbeat, last_sync
         FROM device WHERE device_id = $1`,
        [deviceId]
    );

    const lastSyncResult = await pool.query(
        `SELECT sync_status, sync_type, sync_end_time, error_message
         FROM device_sync_log
         WHERE device_id = $1
         ORDER BY sync_start_time DESC
         LIMIT 1`,
        [deviceId]
    );

    const device = deviceResult.rows[0];
    const lastSync = lastSyncResult.rows[0];

    return {
        batteryLevel: device?.battery_percentage ?? null,
        networkStatus: device?.network_status ?? "UNKNOWN",
        storageAvailable: device?.storage_available_mb ?? null,
        lastSeen: device?.last_heartbeat ?? null,
        syncStatus: lastSync?.sync_status ?? "NEVER_SYNCED",
        lastSyncType: lastSync?.sync_type ?? null,
        lastError: lastSync?.error_message ?? null
    };
};

export const getDeviceSyncHistory = async (deviceId: string) => {
    const result = await pool.query(
        `SELECT sync_log_id, sync_type, sync_status, sync_start_time, sync_end_time,
                records_uploaded, records_downloaded, failed_records, error_message
         FROM device_sync_log
         WHERE device_id = $1
         ORDER BY sync_start_time DESC
         LIMIT 100`,
        [deviceId]
    );
    return result.rows;
};

export const roomHasClaimingDevice = async (
    roomId: string,
    excludingDeviceId?: string
) => {
    const result = await pool.query(
        `SELECT device_id FROM device
         WHERE room_id = $1
           AND is_active = TRUE
           AND device_status IN ('ACTIVE', 'PENDING_PAIRING')
           AND ($2::uuid IS NULL OR device_id != $2)`,
        [roomId, excludingDeviceId ?? null]
    );
    return result.rows.length > 0;
};

const generatePairingCode = () =>
    String(Math.floor(100000 + Math.random() * 900000));

/**
 * Step 1 of pairing: admin creates a device record for a room and gets back
 * a 6-digit code (valid 15 minutes) to hand to whoever is setting up the
 * physical tablet. No device_token exists yet — the record is a placeholder
 * until the device itself calls /devices/pair.
 */
export const createPendingDevice = async (deviceData: any) => {

    const { room_id, device_name, device_type } = deviceData;

    const pairingCode = generatePairingCode();

    const result = await pool.query(
        `INSERT INTO device
            (room_id, device_name, device_type, device_status,
             network_status, pairing_code, pairing_code_expires_at)
         VALUES ($1, $2, $3, 'PENDING_PAIRING', 'OFFLINE', $4,
                 CURRENT_TIMESTAMP + INTERVAL '15 minutes')
         RETURNING *`,
        [
            room_id,
            device_name,
            device_type ?? "ANDROID_TABLET",
            pairingCode
        ]
    );

    return result.rows[0];
};

/**
 * Step 2 of pairing: the physical device exchanges the pairing code for its
 * permanent device_id + device_token. Single-use — the code is cleared the
 * moment it's redeemed, and an expired code is rejected.
 */
export const redeemPairingCode = async (redeemData: any) => {

    const { pairingCode, deviceIdentifier, appVersion, operatingSystem } = redeemData;

    const pending = await pool.query(
        `SELECT device_id FROM device
         WHERE pairing_code = $1
           AND device_status = 'PENDING_PAIRING'
           AND is_active = TRUE
           AND pairing_code_expires_at > CURRENT_TIMESTAMP`,
        [pairingCode]
    );

    if (pending.rowCount === 0) {
        return null;
    }

    const result = await pool.query(
        `UPDATE device
         SET device_token = gen_random_uuid(),
             device_identifier = $2,
             app_version = $3,
             operating_system = $4,
             device_status = 'ACTIVE',
             network_status = 'ONLINE',
             pairing_code = NULL,
             pairing_code_expires_at = NULL,
             registration_date = CURRENT_TIMESTAMP
         WHERE device_id = $1
         RETURNING *`,
        [pending.rows[0].device_id, deviceIdentifier, appVersion, operatingSystem ?? null]
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

    // Reassigning a device to a different room (Section 2 of the
    // architecture doc — "reassignment doesn't require re-pairing") must
    // still respect the one-active-device-per-room rule.
    if (deviceData.room_id) {
        const claimed = await roomHasClaimingDevice(deviceData.room_id, deviceId);
        if (claimed) {
            throw new Error("That room already has an active or pending device assigned to it");
        }
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

export const deactivateDevice = async (deviceId: string) => {
    const result = await pool.query(
        `UPDATE device SET is_active = FALSE, device_status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1
         RETURNING device_id`,
        [deviceId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

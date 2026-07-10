import pool from "../config/database";

/**
 * Room Repository
 *
 * Backend previously had a `room` table but no route/controller/service
 * ever touched it — there was no way to create a room short of connecting
 * to Postgres directly. This module fixes that gap; it's a prerequisite
 * for device pairing, since every device must be assigned to a room.
 */

const SELECT_ROOM = `
    SELECT
        room_id,
        room_number,
        room_name,
        building_name,
        floor_number,
        room_type,
        capacity,
        has_projector,
        has_wifi,
        remarks,
        is_active,
        created_at,
        updated_at
    FROM room
`;

export const getAllRooms = async () => {
    const result = await pool.query(
        `${SELECT_ROOM} WHERE is_active = TRUE ORDER BY room_number`
    );
    return result.rows;
};

export const getRoomById = async (roomId: string) => {
    const result = await pool.query(
        `${SELECT_ROOM} WHERE room_id = $1`,
        [roomId]
    );
    return result.rows[0];
};

export const createRoom = async (roomData: any) => {

    const {
        room_number,
        room_name,
        building_name,
        floor_number,
        room_type,
        capacity,
        has_projector,
        has_wifi,
        remarks
    } = roomData;

    const result = await pool.query(
        `INSERT INTO room
            (room_number, room_name, building_name, floor_number, room_type,
             capacity, has_projector, has_wifi, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
            room_number,
            room_name ?? null,
            building_name,
            floor_number ?? null,
            room_type,
            capacity,
            has_projector ?? false,
            has_wifi ?? true,
            remarks ?? null
        ]
    );

    return result.rows[0];
};

export const updateRoom = async (roomId: string, roomData: any) => {

    const allowedFields = [
        "room_number", "room_name", "building_name", "floor_number",
        "room_type", "capacity", "has_projector", "has_wifi", "remarks"
    ];

    const fields = Object.keys(roomData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getRoomById(roomId);
    }

    const setClause = fields
        .map((field, i) => `${field} = $${i + 2}`)
        .join(", ");

    const values = fields.map(f => roomData[f]);

    const result = await pool.query(
        `UPDATE room
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE room_id = $1
         RETURNING *`,
        [roomId, ...values]
    );

    return result.rows[0] || null;
};

export const deactivateRoom = async (roomId: string) => {
    const result = await pool.query(
        `UPDATE room SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE room_id = $1
         RETURNING room_id`,
        [roomId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

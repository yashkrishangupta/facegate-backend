import { Router } from "express";

import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deactivateRoom
} from "../controllers/RoomController";

const router = Router();

/**
 * Room Routes
 *
 * NEW — previously there was a `room` table with no route touching it at
 * all, meaning a room (and therefore a device, since every device requires
 * a room_id) could only be created by connecting to Postgres directly.
 */

// Get All Rooms
router.get("/", getAllRooms);

// Get Room By ID
router.get("/:roomId", getRoomById);

// Create Room
router.post("/", createRoom);

// Update Room
router.put("/:roomId", updateRoom);

// Deactivate Room
router.delete("/:roomId", deactivateRoom);

export default router;

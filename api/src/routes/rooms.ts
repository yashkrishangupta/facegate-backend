import { Router } from "express";

import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deactivateRoom
} from "../controllers/RoomController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

/**
 * Room Routes
 *
 * NEW — previously there was a `room` table with no route touching it at
 * all, meaning a room (and therefore a device, since every device requires
 * a room_id) could only be created by connecting to Postgres directly.
 *
 * Now behind requireAuth — this whole route used to be wide open (no admin
 * login existed anywhere in this build). Reads are available to any signed-
 * in role (faculty need to see rooms too); writes are ADMIN+.
 */

router.use(requireAuth);

// Get All Rooms
router.get("/", getAllRooms);

// Get Room By ID
router.get("/:roomId", getRoomById);

// Create Room
router.post("/", requireAdmin, createRoom);

// Update Room
router.put("/:roomId", requireAdmin, updateRoom);

// Deactivate Room
router.delete("/:roomId", requireAdmin, deactivateRoom);

export default router;

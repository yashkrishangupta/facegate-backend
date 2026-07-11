import { Router } from "express";

import {
    getAllHolidays,
    getHolidayById,
    createHoliday,
    updateHoliday,
    deleteHoliday
} from "../controllers/HolidayController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

/**
 * Holiday Routes
 */

// Get All Holidays
router.get("/", getAllHolidays);

// Get Holiday by ID
router.get("/:holidayId", getHolidayById);

// Create Holiday
router.post("/", requireAdmin, createHoliday);

// Update Holiday
router.put("/:holidayId", requireAdmin, updateHoliday);

// Delete Holiday
router.delete("/:holidayId", requireAdmin, deleteHoliday);

export default router;
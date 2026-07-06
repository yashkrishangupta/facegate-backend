import { Router } from "express";

import {
    getAllHolidays,
    getHolidayById,
    createHoliday,
    updateHoliday,
    deleteHoliday
} from "../controllers/HolidayController";

const router = Router();

/**
 * Holiday Routes
 */

// Get All Holidays
router.get("/", getAllHolidays);

// Get Holiday by ID
router.get("/:holidayId", getHolidayById);

// Create Holiday
router.post("/", createHoliday);

// Update Holiday
router.put("/:holidayId", updateHoliday);

// Delete Holiday
router.delete("/:holidayId", deleteHoliday);

export default router;
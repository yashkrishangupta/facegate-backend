import { Router } from "express";
import {
    getAllCalendarEntries, getCalendarEntryById, createCalendarEntry,
    updateCalendarEntry, deactivateCalendarEntry
} from "../controllers/AcademicCalendarController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", getAllCalendarEntries);
router.get("/:calendarId", getCalendarEntryById);
router.post("/", requireAdmin, createCalendarEntry);
router.put("/:calendarId", requireAdmin, updateCalendarEntry);
router.delete("/:calendarId", requireAdmin, deactivateCalendarEntry);

export default router;

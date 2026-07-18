import { Router } from "express";
import {
    getAllExtraPeriods,
    getExtraPeriodById,
    createExtraPeriod,
    updateExtraPeriod,
    deleteExtraPeriod
} from "../controllers/ExtraPeriodController";
import { requireAuth, requireAdmin, requireRole } from "../middleware/auth";

const router = Router();

// Every endpoint requires a valid JWT — same as timetable.ts.
router.use(requireAuth);

/**
 * Extra Period Routes
 *
 * Read:  any authenticated role (ADMIN, FACULTY, VIEWER) — consistent with
 *        how timetable GET routes work (requireAuth only).
 *        Faculty users are scoped to their own records inside the controller.
 *
 * Write: ADMIN / SUPER_ADMIN have full access (requireAdmin).
 *        FACULTY may create/update/delete only their own records; ownership
 *        is enforced inside the controller after the role gate passes.
 */

// Read
router.get("/",                  getAllExtraPeriods);
router.get("/:extraPeriodId",    getExtraPeriodById);

// Write — admin OR faculty (ownership checked in controller for faculty).
router.post(   "/",              requireRole(["SUPER_ADMIN", "ADMIN", "FACULTY"]), createExtraPeriod);
router.put(    "/:extraPeriodId", requireRole(["SUPER_ADMIN", "ADMIN", "FACULTY"]), updateExtraPeriod);
router.delete( "/:extraPeriodId", requireRole(["SUPER_ADMIN", "ADMIN", "FACULTY"]), deleteExtraPeriod);

export default router;

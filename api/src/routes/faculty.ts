import { Router } from "express";
import {
    getAllFaculty,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deactivateFaculty
} from "../controllers/FacultyController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getAllFaculty);
router.get("/:facultyId", getFacultyById);
router.post("/", requireAdmin, createFaculty);
router.put("/:facultyId", requireAdmin, updateFaculty);
router.delete("/:facultyId", requireAdmin, deactivateFaculty);

export default router;

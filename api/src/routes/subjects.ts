import { Router } from "express";
import {
    getAllSubjects, getSubjectById, createSubject,
    updateSubject, deactivateSubject
} from "../controllers/SubjectController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", getAllSubjects);
router.get("/:subjectId", getSubjectById);
router.post("/", requireAdmin, createSubject);
router.put("/:subjectId", requireAdmin, updateSubject);
router.delete("/:subjectId", requireAdmin, deactivateSubject);

export default router;

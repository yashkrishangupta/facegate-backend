import { Router } from "express";
import {
    getAllPrograms, getProgramById, createProgram, updateProgram, deactivateProgram
} from "../controllers/ProgramController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", getAllPrograms);
router.get("/:programId", getProgramById);
router.post("/", requireAdmin, createProgram);
router.put("/:programId", requireAdmin, updateProgram);
router.delete("/:programId", requireAdmin, deactivateProgram);

export default router;

import { Router } from "express";
import { getAllChanges } from "../controllers/ChangeLogController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", getAllChanges);

export default router;

import { Router } from "express";
import {
    getAllBatches, getBatchById, createBatch, updateBatch, deactivateBatch
} from "../controllers/BatchController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", getAllBatches);
router.get("/:batchId", getBatchById);
router.post("/", requireAdmin, createBatch);
router.put("/:batchId", requireAdmin, updateBatch);
router.delete("/:batchId", requireAdmin, deactivateBatch);

export default router;

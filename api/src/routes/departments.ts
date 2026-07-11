import { Router } from "express";
import {
    getAllDepartments, getDepartmentById, createDepartment,
    updateDepartment, deactivateDepartment
} from "../controllers/DepartmentController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", getAllDepartments);
router.get("/:departmentId", getDepartmentById);
router.post("/", requireAdmin, createDepartment);
router.put("/:departmentId", requireAdmin, updateDepartment);
router.delete("/:departmentId", requireAdmin, deactivateDepartment);

export default router;

import { Router } from "express";
import {
    login,
    updateAdminDetails,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    updateSecurity,
    createAdmin,
    getAllAdmins,
    deactivateAdmin
} from "../controllers/AdminController";
import { requireAuth, requireAdmin, requireSuperAdmin } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.use(requireAuth);
router.post("/logout", logout);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.get("/", requireAdmin, getAllAdmins);
router.post("/", requireSuperAdmin, createAdmin);
router.put("/:adminId/security", requireSuperAdmin, updateSecurity);
router.put("/:adminId", requireSuperAdmin, updateAdminDetails);
router.delete("/:adminId", requireSuperAdmin, deactivateAdmin);

export default router;

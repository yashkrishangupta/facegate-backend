import { Router } from "express";

import {
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    updateSecurity,
    getAllAdmins,
    deactivateAdmin
} from "../controllers/AdminController";
import { requireAuth, requireAdmin, requireSuperAdmin } from "../middleware/auth";

const router = Router();

/**
 * Admin Routes
 */

// Login — public, this is how a token is obtained
router.post("/login", login);

// Everything below requires a valid session
router.use(requireAuth);

// Logout
router.post("/logout", logout);

// Profile — every authenticated role can see/edit their own profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Change Password — self-service, every role, requires currentPassword
router.put("/change-password", changePassword);

// Get All Admins — ADMIN and SUPER_ADMIN only
router.get("/", requireAdmin, getAllAdmins);

// Security settings (role / account_status / reset another user's password)
// — SUPER_ADMIN only. Deliberately separate from /profile so an ADMIN has
// no path to touching these fields even by accident.
router.put("/:adminId/security", requireSuperAdmin, updateSecurity);

// Deactivate Admin — SUPER_ADMIN only
router.delete("/:adminId", requireSuperAdmin, deactivateAdmin);

export default router;

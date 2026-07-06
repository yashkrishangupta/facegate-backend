import { Router } from "express";

import {
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    getAllAdmins
} from "../controllers/AdminController";

const router = Router();

/**
 * Admin Routes
 */

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

// Profile
router.get("/profile", getProfile);

// Update Profile
router.put("/profile", updateProfile);

// Change Password
router.put("/change-password", changePassword);

// Get All Admins
router.get("/", getAllAdmins);

export default router;
import { Request, Response } from "express";
import * as AdminService from "../services/AdminService";
import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

/**
 * Login
 */
export const login = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const result = await AdminService.login(req.body);

        if (!result.success) {
            res.status(401).json(result);
            return;
        }

        await ChangeLogRepository.recordChange(
            result.admin.admin_id, "admin_user", result.admin.admin_id, "LOGIN"
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { token: result.token, admin: result.admin }
        });

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err?.message || "Login failed"
        });

    }

};

/**
 * Logout
 */
export const logout = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        await AdminService.logout();

        res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Logout failed"
        });

    }

};

/**
 * Get Profile — always the caller's own profile, from their JWT.
 */
export const getProfile = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const profile = await AdminService.getProfile(req.user!.adminId);

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });

    }

};

/**
 * Update Profile — caller's own profile only. Cannot touch role/status/
 * password (see AdminRepository.updateProfile's allow-list).
 */
export const updateProfile = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const profile = await AdminService.updateProfile(req.user!.adminId, req.body);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });

    }

};

/**
 * Change Password — caller's own password, requires currentPassword.
 * Available to every role, including FACULTY/VIEWER.
 */
export const changePassword = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const result = await AdminService.changePassword(req.user!.adminId, req.body);

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.status(200).json(result);

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err?.message || "Failed to change password"
        });

    }

};

/**
 * Update Security (role / account_status / reset someone else's password)
 * — SUPER_ADMIN only, enforced by requireSuperAdmin on the route. Unlike
 * changePassword, no currentPassword is required — this is a reset, not a
 * self-service change.
 */
export const updateSecurity = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const targetAdminId = req.params.adminId as string;
        const admin = await AdminService.updateSecurity(targetAdminId, req.body);

        if (!admin) {
            res.status(404).json({ success: false, message: "Admin not found" });
            return;
        }

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "admin_user", targetAdminId, "UPDATE", null,
            {
                // Deliberately excludes newPassword — only records THAT a
                // reset happened, never the value.
                passwordReset: !!req.body.newPassword,
                role: req.body.role,
                account_status: req.body.account_status
            }
        );

        res.status(200).json({
            success: true,
            message: "Security settings updated successfully",
            data: admin
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update security settings"
        });

    }

};

/**
 * Get All Admins
 */
export const getAllAdmins = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const admins = await AdminService.getAllAdmins();

        res.status(200).json({
            success: true,
            data: admins
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch admins"
        });

    }

};

/**
 * Deactivate Admin (soft delete)
 */
export const deactivateAdmin = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const adminId = req.params.adminId as string;
        const result = await AdminService.deactivateAdmin(adminId);

        res.status(200).json({
            success: result.success,
            message: result.success ? "Admin deactivated successfully" : "Admin not found"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to deactivate admin"
        });

    }

};

/**
 * Create Admin — SUPER_ADMIN only, direct creation of a plain ADMIN/
 * SUPER_ADMIN/VIEWER account (FACULTY accounts go through POST /faculty
 * instead, since those also need a linked teaching record).
 */
export const createAdmin = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const admin = await AdminService.createAdmin(req.body);

        res.status(201).json({
            success: true,
            message: `Admin account created. Username: ${admin.username}`,
            data: admin
        });

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err?.message || "Failed to create admin"
        });

    }

};

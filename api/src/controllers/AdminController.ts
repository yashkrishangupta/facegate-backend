import { Request, Response } from "express";
import * as AdminService from "../services/AdminService";

/**
 * Login
 */
export const login = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const result = await AdminService.login(req.body);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Login failed"
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
 * Get Profile
 */
export const getProfile = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const profile = await AdminService.getProfile();

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
 * Update Profile
 */
export const updateProfile = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const profile =
            await AdminService.updateProfile(req.body);

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
 * Change Password
 */
export const changePassword = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        await AdminService.changePassword(req.body);

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to change password"
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
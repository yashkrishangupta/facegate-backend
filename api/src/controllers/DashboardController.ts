import { Request, Response } from "express";
import * as DashboardService from "../services/DashboardService";

/**
 * Dashboard Summary
 */
export const getDashboardSummary = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const facultyId = req.user?.role === "FACULTY" ? req.user.facultyId : undefined;

        const dashboard =
            await DashboardService.getDashboardSummary(facultyId);

        res.status(200).json({
            success: true,
            data: dashboard
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary"
        });

    }

};

/**
 * Recent Attendance
 */
export const getRecentAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const facultyId = req.user?.role === "FACULTY" ? req.user.facultyId : undefined;

        const attendance =
            await DashboardService.getRecentAttendance(facultyId);

        res.status(200).json({
            success: true,
            data: attendance
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch recent attendance"
        });

    }

};

/**
 * Recent Conflicts
 */
export const getRecentConflicts = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const facultyId = req.user?.role === "FACULTY" ? req.user.facultyId : undefined;

        const conflicts =
            await DashboardService.getRecentConflicts(facultyId);

        res.status(200).json({
            success: true,
            data: conflicts
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch recent conflicts"
        });

    }

};

/**
 * Recent Notifications
 */
export const getRecentNotifications = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const notifications =
            await DashboardService.getRecentNotifications();

        res.status(200).json({
            success: true,
            data: notifications
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });

    }

};
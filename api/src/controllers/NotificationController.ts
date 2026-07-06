import { Request, Response } from "express";
import * as NotificationService from "../services/NotificationService";

/**
 * Get All Notifications
 */
export const getAllNotifications = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const notifications =
            await NotificationService.getAllNotifications();

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

/**
 * Get Notification By ID
 */
export const getNotificationById = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const notificationId =
            req.params.notificationId as string;

        const notification =
            await NotificationService.getNotificationById(
                notificationId
            );

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch notification"
        });

    }

};

/**
 * Create Notification
 */
export const createNotification = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const notification =
            await NotificationService.createNotification(req.body);

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to create notification"
        });

    }

};

/**
 * Mark Notification as Read
 */
export const markAsRead = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const notificationId =
            req.params.notificationId as string;

        const notification =
            await NotificationService.markAsRead(notificationId);

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update notification"
        });

    }

};

/**
 * Delete Notification
 */
export const deleteNotification = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const notificationId =
            req.params.notificationId as string;

        await NotificationService.deleteNotification(notificationId);

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to delete notification"
        });

    }

};
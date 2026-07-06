import { Router } from "express";

import {
    getAllNotifications,
    getNotificationById,
    createNotification,
    markAsRead,
    deleteNotification
} from "../controllers/NotificationController";

const router = Router();

/**
 * Notification Routes
 */

// Get All Notifications
router.get("/", getAllNotifications);

// Get Notification By ID
router.get("/:notificationId", getNotificationById);

// Create Notification
router.post("/", createNotification);

// Mark Notification as Read
router.put("/:notificationId/read", markAsRead);

// Delete Notification
router.delete("/:notificationId", deleteNotification);

export default router;
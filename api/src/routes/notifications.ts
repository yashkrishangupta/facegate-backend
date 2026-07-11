import { Router } from "express";

import {
    getAllNotifications,
    getNotificationById,
    createNotification,
    markAsRead,
    deleteNotification
} from "../controllers/NotificationController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

/**
 * Notification Routes
 */

// Get All Notifications
router.get("/", getAllNotifications);

// Get Notification By ID
router.get("/:notificationId", getNotificationById);

// Create Notification
router.post("/", requireAdmin, createNotification);

// Mark Notification as Read
router.put("/:notificationId/read", markAsRead);

// Delete Notification
router.delete("/:notificationId", requireAdmin, deleteNotification);

export default router;
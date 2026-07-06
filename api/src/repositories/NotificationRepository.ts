/**
 * Mock Notification Repository
 */

let notifications = [

    {
        notificationId: "N001",
        title: "Attendance Sync Completed",
        message: "Attendance records have been synchronized successfully.",
        type: "SYNC",
        priority: "LOW",
        isRead: false,
        createdAt: "2026-07-06T09:10:00Z"
    },

    {
        notificationId: "N002",
        title: "Device Offline",
        message: "Tablet LH102 is currently offline.",
        type: "DEVICE",
        priority: "HIGH",
        isRead: false,
        createdAt: "2026-07-06T10:20:00Z"
    },

    {
        notificationId: "N003",
        title: "Unknown Face Detected",
        message: "Unknown person detected during attendance.",
        type: "SECURITY",
        priority: "CRITICAL",
        isRead: true,
        createdAt: "2026-07-05T14:00:00Z"
    }

];

/**
 * Get All Notifications
 */
export const getAllNotifications = async () => {
    return notifications;
};

/**
 * Get Notification By ID
 */
export const getNotificationById = async (
    notificationId: string
) => {

    return notifications.find(
        notification => notification.notificationId === notificationId
    );

};

/**
 * Create Notification
 */
export const createNotification = async (
    notificationData: any
) => {

    const newNotification = {
        notificationId: `N${String(notifications.length + 1).padStart(3, "0")}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        ...notificationData
    };

    notifications.push(newNotification);

    return newNotification;

};

/**
 * Mark Notification As Read
 */
export const markAsRead = async (
    notificationId: string
) => {

    const notification = notifications.find(
        n => n.notificationId === notificationId
    );

    if (!notification) {
        return null;
    }

    notification.isRead = true;

    return notification;

};

/**
 * Delete Notification
 */
export const deleteNotification = async (
    notificationId: string
) => {

    notifications = notifications.filter(
        notification => notification.notificationId !== notificationId
    );

    return {
        success: true
    };

};
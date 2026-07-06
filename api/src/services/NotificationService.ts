import * as NotificationRepository from "../repositories/NotificationRepository";

/**
 * Get All Notifications
 */
export const getAllNotifications = async () => {
    return await NotificationRepository.getAllNotifications();
};

/**
 * Get Notification By ID
 */
export const getNotificationById = async (
    notificationId: string
) => {
    return await NotificationRepository.getNotificationById(notificationId);
};

/**
 * Create Notification
 */
export const createNotification = async (
    notificationData: any
) => {
    return await NotificationRepository.createNotification(notificationData);
};

/**
 * Mark Notification As Read
 */
export const markAsRead = async (
    notificationId: string
) => {
    return await NotificationRepository.markAsRead(notificationId);
};

/**
 * Delete Notification
 */
export const deleteNotification = async (
    notificationId: string
) => {
    return await NotificationRepository.deleteNotification(notificationId);
};
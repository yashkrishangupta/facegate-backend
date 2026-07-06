import * as DashboardRepository from "../repositories/DashboardRepository";

/**
 * Dashboard Summary
 */
export const getDashboardSummary = async () => {
    return await DashboardRepository.getDashboardSummary();
};

/**
 * Recent Attendance
 */
export const getRecentAttendance = async () => {
    return await DashboardRepository.getRecentAttendance();
};

/**
 * Recent Conflicts
 */
export const getRecentConflicts = async () => {
    return await DashboardRepository.getRecentConflicts();
};

/**
 * Recent Notifications
 */
export const getRecentNotifications = async () => {
    return await DashboardRepository.getRecentNotifications();
};
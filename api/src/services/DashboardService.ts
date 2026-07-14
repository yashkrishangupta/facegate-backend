import * as DashboardRepository from "../repositories/DashboardRepository";

/**
 * Dashboard Summary
 */
export const getDashboardSummary = async (facultyId?: string | null) => {
    return await DashboardRepository.getDashboardSummary(facultyId);
};

/**
 * Recent Attendance
 */
export const getRecentAttendance = async (facultyId?: string | null) => {
    return await DashboardRepository.getRecentAttendance(facultyId);
};

/**
 * Recent Conflicts
 */
export const getRecentConflicts = async (facultyId?: string | null) => {
    return await DashboardRepository.getRecentConflicts(facultyId);
};

/**
 * Recent Notifications
 */
export const getRecentNotifications = async () => {
    return await DashboardRepository.getRecentNotifications();
};
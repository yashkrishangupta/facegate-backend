import * as ReportRepository from "../repositories/ReportRepository";

/**
 * Daily Report
 */
export const getDailyReport = async () => {
    return await ReportRepository.getDailyReport();
};

/**
 * Student Report
 */
export const getStudentReport = async (
    studentId: string
) => {
    return await ReportRepository.getStudentReport(studentId);
};

/**
 * Faculty Report
 */
export const getFacultyReport = async (
    facultyId: string
) => {
    return await ReportRepository.getFacultyReport(facultyId);
};

/**
 * Department Report
 */
export const getDepartmentReport = async (
    departmentId: string
) => {
    return await ReportRepository.getDepartmentReport(departmentId);
};

/**
 * Summary Report
 */
export const getSummaryReport = async () => {
    return await ReportRepository.getSummaryReport();
};
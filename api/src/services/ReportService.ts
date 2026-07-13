import * as ReportRepository from "../repositories/ReportRepository";

/**
 * Export Report — CSV, one row per attendance record.
 */
export const exportReport = async (
    reportType: "student" | "batch" | "subject",
    id: string,
    from?: string,
    to?: string
) => {
    if (!id) throw new Error("id is required");
    if (!["student", "batch", "subject"].includes(reportType)) {
        throw new Error("reportType must be student, batch, or subject");
    }
    return await ReportRepository.getExportRows(reportType, id, from, to);
};

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
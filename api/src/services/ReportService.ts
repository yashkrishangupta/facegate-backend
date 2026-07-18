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
export const getDailyReport = async (date?: string, facultyId?: string | null) => {
    return await ReportRepository.getDailyReport(date, facultyId);
};

/**
 * Student Report
 */
export const getStudentReport = async (
    studentId: string,
    from?: string,
    to?: string,
    semester?: string
) => {
    return await ReportRepository.getStudentReport(studentId, from, to, semester);
};

export const getBatchReport = async (batchId: string, from?: string, to?: string) => {
    return await ReportRepository.getBatchReport(batchId, from, to);
};

export const getSubjectReport = async (subjectId: string, from?: string, to?: string) => {
    return await ReportRepository.getSubjectReport(subjectId, from, to);
};

export const getRoomReport = async (roomId: string, from?: string, to?: string) => {
    return await ReportRepository.getRoomReport(roomId, from, to);
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
export const getSummaryReport = async (facultyId?: string | null) => {
    return await ReportRepository.getSummaryReport(facultyId);
};
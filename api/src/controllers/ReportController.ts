import { Request, Response } from "express";
import * as ReportService from "../services/ReportService";

const toCsv = (rows: any[]): string => {
    if (rows.length === 0) return "date,student_name,roll_number,batch_code,subject_code,subject_name,faculty_name,status,attendance_mode\n";
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
        const s = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const row of rows) {
        lines.push(headers.map(h => escape(row[h])).join(","));
    }
    return lines.join("\n");
};

/**
 * GET /reports/export?reportType=student|batch|subject&id=&from=&to=
 * Referenced by the frontend since it was first built; never had a route.
 */
export const exportReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const { reportType, id, from, to } = req.query as Record<string, string>;
        const rows = await ReportService.exportReport(reportType as any, id, from, to);
        const csv = toCsv(rows);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="facegate-${reportType}-report.csv"`);
        res.status(200).send(csv);

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err?.message || "Failed to export report"
        });

    }

};

/**
 * Daily Report
 */
export const getDailyReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const date = req.query.date as string | undefined;
        const facultyId = req.user?.role === "FACULTY" ? req.user.facultyId : undefined;

        const report = await ReportService.getDailyReport(date, facultyId);

        res.status(200).json({
            success: true,
            data: report
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch daily report"
        });

    }

};

/**
 * Student Report
 */
export const getStudentReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const studentId = req.params.studentId as string;
        const { from, to, semester } = req.query as Record<string, string>;

        const report =
            await ReportService.getStudentReport(studentId, from, to, semester);

        res.status(200).json({
            success: true,
            data: report
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch student report"
        });

    }

};

/**
 * Faculty Report
 */
export const getFacultyReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const facultyId = req.params.facultyId as string;

        // A FACULTY-role caller can only ever pull their own report — this
        // is the one place a faculty could otherwise directly request
        // another faculty member's data just by changing the URL param.
        if (req.user?.role === "FACULTY" && req.user.facultyId !== facultyId) {
            res.status(403).json({ success: false, message: "You can only view your own report" });
            return;
        }

        const report =
            await ReportService.getFacultyReport(facultyId);

        res.status(200).json({
            success: true,
            data: report
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch faculty report"
        });

    }

};

/**
 * Department Report
 */
export const getDepartmentReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        // Unlike daily/summary (scoped down to the caller's own sessions),
        // a department report is inherently about a group small enough
        // that a faculty member could infer a colleague's numbers from it
        // — so it's blocked outright for FACULTY, not scoped.
        if (req.user?.role === "FACULTY") {
            res.status(403).json({ success: false, message: "Department reports are not available to faculty accounts" });
            return;
        }

        const departmentId =
            req.params.departmentId as string;

        const report =
            await ReportService.getDepartmentReport(
                departmentId
            );

        res.status(200).json({
            success: true,
            data: report
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch department report"
        });

    }

};

/**
 * Dashboard Summary Report
 */
export const getSummaryReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const facultyId = req.user?.role === "FACULTY" ? req.user.facultyId : undefined;

        const report =
            await ReportService.getSummaryReport(facultyId);

        res.status(200).json({
            success: true,
            data: report
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch summary report"
        });

    }

};
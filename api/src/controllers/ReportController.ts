import { Request, Response } from "express";
import * as ReportService from "../services/ReportService";

/**
 * Daily Report
 */
export const getDailyReport = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const report = await ReportService.getDailyReport();

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

        const report =
            await ReportService.getStudentReport(studentId);

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

        const report =
            await ReportService.getSummaryReport();

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
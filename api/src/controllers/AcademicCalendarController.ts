import { Request, Response } from "express";
import * as AcademicCalendarService from "../services/AcademicCalendarService";

export const getAllCalendarEntries = async (req: Request, res: Response): Promise<void> => {
    try {
        const { academic_year, semester } = req.query;
        res.status(200).json({
            success: true,
            data: await AcademicCalendarService.getAllCalendarEntries({ academic_year, semester })
        });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch calendar entries" });
    }
};

export const getCalendarEntryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const entry = await AcademicCalendarService.getCalendarEntryById(req.params.calendarId as string);
        if (!entry) { res.status(404).json({ success: false, message: "Calendar entry not found" }); return; }
        res.status(200).json({ success: true, data: entry });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch calendar entry" });
    }
};

export const createCalendarEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const entry = await AcademicCalendarService.createCalendarEntry(req.body);
        res.status(201).json({ success: true, message: "Calendar entry created successfully", data: entry });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err?.message || "Failed to create calendar entry" });
    }
};

export const updateCalendarEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const entry = await AcademicCalendarService.updateCalendarEntry(req.params.calendarId as string, req.body);
        res.status(200).json({ success: true, message: "Calendar entry updated successfully", data: entry });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update calendar entry" });
    }
};

export const deactivateCalendarEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await AcademicCalendarService.deactivateCalendarEntry(req.params.calendarId as string);
        res.status(200).json({ success: true, message: "Calendar entry deactivated successfully", data: result });
    } catch {
        res.status(500).json({ success: false, message: "Failed to deactivate calendar entry" });
    }
};

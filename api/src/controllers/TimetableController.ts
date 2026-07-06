import { Request, Response } from "express";
import * as TimetableService from "../services/TimetableService";

/**
 * Get All Timetable
 */
export const getAllTimetable = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const timetable = await TimetableService.getAllTimetable();

        res.status(200).json({
            success: true,
            data: timetable
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch timetable"
        });

    }

};

/**
 * Get Today's Timetable
 */
export const getTodayTimetable = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const timetable = await TimetableService.getTodayTimetable();

        res.status(200).json({
            success: true,
            data: timetable
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch today's timetable"
        });

    }

};

/**
 * Get Timetable By Batch
 */
export const getTimetableByBatch = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const batchId = req.params.batchId as string;

        const timetable =
            await TimetableService.getTimetableByBatch(batchId);

        res.status(200).json({
            success: true,
            data: timetable
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch batch timetable"
        });

    }

};

/**
 * Get Timetable By Faculty
 */
export const getTimetableByFaculty = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const facultyId = req.params.facultyId as string;

        const timetable =
            await TimetableService.getTimetableByFaculty(facultyId);

        res.status(200).json({
            success: true,
            data: timetable
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch faculty timetable"
        });

    }

};

/**
 * Create Timetable
 */
export const createTimetable = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const timetable =
            await TimetableService.createTimetable(req.body);

        res.status(201).json({
            success: true,
            message: "Timetable created successfully",
            data: timetable
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to create timetable"
        });

    }

};

/**
 * Update Timetable
 */
export const updateTimetable = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const timetableId = req.params.timetableId as string;

        const timetable =
            await TimetableService.updateTimetable(
                timetableId,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Timetable updated successfully",
            data: timetable
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update timetable"
        });

    }

};

/**
 * Delete Timetable
 */
export const deleteTimetable = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const timetableId = req.params.timetableId as string;

        await TimetableService.deleteTimetable(timetableId);

        res.status(200).json({
            success: true,
            message: "Timetable deleted successfully"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to delete timetable"
        });

    }

};

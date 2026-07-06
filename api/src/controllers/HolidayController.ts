import { Request, Response } from "express";
import * as HolidayService from "../services/HolidayService";

/**
 * Get All Holidays
 */
export const getAllHolidays = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const holidays = await HolidayService.getAllHolidays();

        res.status(200).json({
            success: true,
            data: holidays
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch holidays"
        });

    }

};

/**
 * Get Holiday By ID
 */
export const getHolidayById = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const holidayId = req.params.holidayId as string;

        const holiday = await HolidayService.getHolidayById(holidayId);

        res.status(200).json({
            success: true,
            data: holiday
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch holiday"
        });

    }

};

/**
 * Create Holiday
 */
export const createHoliday = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const holiday = await HolidayService.createHoliday(req.body);

        res.status(201).json({
            success: true,
            message: "Holiday created successfully",
            data: holiday
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to create holiday"
        });

    }

};

/**
 * Update Holiday
 */
export const updateHoliday = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const holidayId = req.params.holidayId as string;

        const holiday = await HolidayService.updateHoliday(
            holidayId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Holiday updated successfully",
            data: holiday
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update holiday"
        });

    }

};

/**
 * Delete Holiday
 */
export const deleteHoliday = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const holidayId = req.params.holidayId as string;

        await HolidayService.deleteHoliday(holidayId);

        res.status(200).json({
            success: true,
            message: "Holiday deleted successfully"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to delete holiday"
        });

    }

};
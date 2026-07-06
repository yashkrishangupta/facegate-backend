import { Request, Response } from "express";
import * as SyncService from "../services/SyncService";

export const fullSync = async (req: Request, res: Response) => {
    const data = await SyncService.fullSync();

    res.status(200).json({
        success: true,
        message: "Full sync completed",
        data
    });
};

export const incrementalSync = async (req: Request, res: Response) => {
    const data = await SyncService.incrementalSync();

    res.status(200).json({
        success: true,
        message: "Incremental sync completed",
        data
    });
};

export const uploadAttendance = async (req: Request, res: Response) => {

    const result = await SyncService.uploadAttendance(req.body);

    res.status(200).json({
        success: true,
        message: "Attendance uploaded successfully",
        data: result
    });
};

export const getSyncStatus = async (req: Request, res: Response) => {

    const status = await SyncService.getSyncStatus();

    res.status(200).json({
        success: true,
        data: status
    });
};

export const retrySync = async (req: Request, res: Response) => {

    const result = await SyncService.retrySync();

    res.status(200).json({
        success: true,
        message: "Retry completed",
        data: result
    });
};
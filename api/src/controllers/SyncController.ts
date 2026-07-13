import { Request, Response } from "express";
import * as SyncService from "../services/SyncService";

// deviceAuth middleware (run on every route in routes/sync.ts) attaches the
// authenticated device to req.device — this is how each device only ever
// syncs its own room, per the architecture doc's sync protocol.
const getDeviceContext = (req: Request) => {
    const device = (req as any).device;
    return { deviceId: device.device_id, roomId: device.room_id };
};

export const fullSync = async (req: Request, res: Response) => {
    try {
        const { deviceId, roomId } = getDeviceContext(req);
        const data = await SyncService.fullSync(deviceId, roomId);

        res.status(200).json({
            success: true,
            message: "Full sync completed",
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Full sync failed" });
    }
};

export const incrementalSync = async (req: Request, res: Response) => {
    try {
        const { deviceId, roomId } = getDeviceContext(req);
        const since = req.query.since as string | undefined;
        const data = await SyncService.incrementalSync(deviceId, roomId, since);

        res.status(200).json({
            success: true,
            message: "Incremental sync completed",
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Incremental sync failed" });
    }
};

export const uploadAttendance = async (req: Request, res: Response) => {
    try {
        const { deviceId } = getDeviceContext(req);
        const result = await SyncService.uploadAttendance(deviceId, req.body);

        res.status(200).json({
            success: true,
            message: "Attendance uploaded successfully",
            data: result
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Attendance upload failed" });
    }
};

export const getSyncStatus = async (req: Request, res: Response) => {
    try {
        const { deviceId } = getDeviceContext(req);
        const status = await SyncService.getSyncStatus(deviceId);

        res.status(200).json({ success: true, data: status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch sync status" });
    }
};

export const retrySync = async (req: Request, res: Response) => {
    try {
        const { deviceId, roomId } = getDeviceContext(req);
        const result = await SyncService.retrySync(deviceId, roomId);

        res.status(200).json({ success: true, message: "Retry completed", data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Retry failed" });
    }
};
export const uploadEmbedding = async (req: Request, res: Response) => {
    try {
        const { deviceId } = getDeviceContext(req);
        const result = await SyncService.uploadEmbedding(deviceId, req.body);

        res.status(200).json({
            success: true,
            message: "Embedding uploaded successfully",
            data: result
        });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ success: false, message: err?.message || "Embedding upload failed" });
    }
};

export const enrollStudent = async (req: Request, res: Response) => {
    try {
        const { deviceId } = getDeviceContext(req);
        const result = await SyncService.enrollStudent(deviceId, req.body);

        res.status(201).json({
            success: true,
            message: "Student enrolled successfully",
            data: { student_id: result.student_id, embedding_id: result.embedding_id }
        });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ success: false, message: err?.message || "Student enrollment failed" });
    }
};

export const uploadConflicts = async (req: Request, res: Response) => {
    try {
        const { deviceId } = getDeviceContext(req);
        const result = await SyncService.uploadConflicts(deviceId, req.body);

        res.status(200).json({
            success: true,
            message: "Conflicts uploaded successfully",
            data: result
        });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ success: false, message: err?.message || "Conflict upload failed" });
    }
};

export const resolveConflict = async (req: Request, res: Response) => {
    try {
        const { deviceId } = getDeviceContext(req);
        const conflictId = req.params.conflictId as string;
        const { conflict_status } = req.body;

        await SyncService.resolveConflict(deviceId, conflictId, conflict_status);

        res.status(200).json({
            success: true,
            message: `Conflict marked ${conflict_status}`
        });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ success: false, message: err?.message || "Failed to resolve conflict" });
    }
};

export const getReports = async (req: Request, res: Response) => {
    try {
        const { deviceId, roomId } = getDeviceContext(req);
        const since = req.query.since as string | undefined;
        const reports = await SyncService.getReports(deviceId, roomId, since);

        res.status(200).json({ success: true, data: reports });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch reports" });
    }
};

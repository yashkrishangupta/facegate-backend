import { Request, Response } from "express";
import * as BatchService from "../services/BatchService";
import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

export const getAllBatches = async (req: Request, res: Response): Promise<void> => {
    try {
        const { academic_year, semester, program_id, department_id } = req.query;
        const batches = await BatchService.getAllBatches({ academic_year, semester, program_id, department_id });
        res.status(200).json({ success: true, data: batches });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch batches" });
    }
};

export const getBatchById = async (req: Request, res: Response): Promise<void> => {
    try {
        const batch = await BatchService.getBatchById(req.params.batchId as string);
        if (!batch) { res.status(404).json({ success: false, message: "Batch not found" }); return; }
        res.status(200).json({ success: true, data: batch });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch batch" });
    }
};

export const createBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const batch = await BatchService.createBatch(req.body);
        await ChangeLogRepository.recordChange(req.user?.adminId ?? null, "batch", batch.batch_id, "CREATE", null, batch);
        res.status(201).json({ success: true, message: "Batch created successfully", data: batch });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err?.message || "Failed to create batch" });
    }
};

export const updateBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const batchId = req.params.batchId as string;
        const batch = await BatchService.updateBatch(batchId, req.body);
        await ChangeLogRepository.recordChange(req.user?.adminId ?? null, "batch", batchId, "UPDATE", null, req.body);
        res.status(200).json({ success: true, message: "Batch updated successfully", data: batch });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update batch" });
    }
};

export const deactivateBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const batchId = req.params.batchId as string;
        const result = await BatchService.deactivateBatch(batchId);
        await ChangeLogRepository.recordChange(req.user?.adminId ?? null, "batch", batchId, "DELETE");
        res.status(200).json({ success: true, message: "Batch deactivated successfully", data: result });
    } catch {
        res.status(500).json({ success: false, message: "Failed to deactivate batch" });
    }
};

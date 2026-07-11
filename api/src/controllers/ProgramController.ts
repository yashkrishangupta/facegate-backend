import { Request, Response } from "express";
import * as ProgramService from "../services/ProgramService";
import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

export const getAllPrograms = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({ success: true, data: await ProgramService.getAllPrograms() });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch programs" });
    }
};

export const getProgramById = async (req: Request, res: Response): Promise<void> => {
    try {
        const program = await ProgramService.getProgramById(req.params.programId as string);
        if (!program) { res.status(404).json({ success: false, message: "Program not found" }); return; }
        res.status(200).json({ success: true, data: program });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch program" });
    }
};

export const createProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const program = await ProgramService.createProgram(req.body);
        await ChangeLogRepository.recordChange(req.user?.adminId ?? null, "program", program.program_id, "CREATE", null, program);
        res.status(201).json({ success: true, message: "Program created successfully", data: program });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err?.message || "Failed to create program" });
    }
};

export const updateProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const programId = req.params.programId as string;
        const program = await ProgramService.updateProgram(programId, req.body);
        await ChangeLogRepository.recordChange(req.user?.adminId ?? null, "program", programId, "UPDATE", null, req.body);
        res.status(200).json({ success: true, message: "Program updated successfully", data: program });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update program" });
    }
};

export const deactivateProgram = async (req: Request, res: Response): Promise<void> => {
    try {
        const programId = req.params.programId as string;
        const result = await ProgramService.deactivateProgram(programId);
        await ChangeLogRepository.recordChange(req.user?.adminId ?? null, "program", programId, "DELETE");
        res.status(200).json({ success: true, message: "Program deactivated successfully", data: result });
    } catch {
        res.status(500).json({ success: false, message: "Failed to deactivate program" });
    }
};

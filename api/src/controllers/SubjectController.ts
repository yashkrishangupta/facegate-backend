import { Request, Response } from "express";
import * as SubjectService from "../services/SubjectService";

export const getAllSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const { program_id, semester, department_id } = req.query;
        res.status(200).json({
            success: true,
            data: await SubjectService.getAllSubjects({ program_id, semester, department_id })
        });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch subjects" });
    }
};

export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = await SubjectService.getSubjectById(req.params.subjectId as string);
        if (!subject) { res.status(404).json({ success: false, message: "Subject not found" }); return; }
        res.status(200).json({ success: true, data: subject });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch subject" });
    }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = await SubjectService.createSubject(req.body);
        res.status(201).json({ success: true, message: "Subject created successfully", data: subject });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err?.message || "Failed to create subject" });
    }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = await SubjectService.updateSubject(req.params.subjectId as string, req.body);
        res.status(200).json({ success: true, message: "Subject updated successfully", data: subject });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update subject" });
    }
};

export const deactivateSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await SubjectService.deactivateSubject(req.params.subjectId as string);
        res.status(200).json({ success: true, message: "Subject deactivated successfully", data: result });
    } catch {
        res.status(500).json({ success: false, message: "Failed to deactivate subject" });
    }
};

import { Request, Response } from "express";
import * as DepartmentService from "../services/DepartmentService";

export const getAllDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({ success: true, data: await DepartmentService.getAllDepartments() });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch departments" });
    }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const dept = await DepartmentService.getDepartmentById(req.params.departmentId as string);
        if (!dept) { res.status(404).json({ success: false, message: "Department not found" }); return; }
        res.status(200).json({ success: true, data: dept });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch department" });
    }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const dept = await DepartmentService.createDepartment(req.body);
        res.status(201).json({ success: true, message: "Department created successfully", data: dept });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err?.message || "Failed to create department" });
    }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const dept = await DepartmentService.updateDepartment(req.params.departmentId as string, req.body);
        res.status(200).json({ success: true, message: "Department updated successfully", data: dept });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update department" });
    }
};

export const deactivateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await DepartmentService.deactivateDepartment(req.params.departmentId as string);
        res.status(200).json({ success: true, message: "Department deactivated successfully", data: result });
    } catch {
        res.status(500).json({ success: false, message: "Failed to deactivate department" });
    }
};

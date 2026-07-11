import { Request, Response } from "express";
import * as FacultyService from "../services/FacultyService";
import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

export const getAllFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const faculty = await FacultyService.getAllFaculty();
        res.status(200).json({ success: true, data: faculty });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch faculty" });
    }
};

export const getFacultyById = async (req: Request, res: Response): Promise<void> => {
    try {
        const faculty = await FacultyService.getFacultyById(req.params.facultyId as string);
        if (!faculty) {
            res.status(404).json({ success: false, message: "Faculty not found" });
            return;
        }
        res.status(200).json({ success: true, data: faculty });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch faculty" });
    }
};

/**
 * Create Faculty — also provisions the login account (username generated,
 * password as supplied by the admin in the request body). Returns the
 * generated username so the admin can hand it to the faculty member.
 */
export const createFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const { faculty, account } = await FacultyService.createFaculty(req.body);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "faculty", faculty.faculty_id, "CREATE", null,
            { employee_id: faculty.employee_id, first_name: faculty.first_name,
              last_name: faculty.last_name, username: account.username }
            // Deliberately never includes the password, hashed or not.
        );

        res.status(201).json({
            success: true,
            message: `Faculty created. Login username: ${account.username}`,
            data: { faculty, account }
        });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err?.message || "Failed to create faculty" });
    }
};

export const updateFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const facultyId = req.params.facultyId as string;
        const faculty = await FacultyService.updateFaculty(facultyId, req.body);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "faculty", facultyId, "UPDATE", null, req.body
        );

        res.status(200).json({ success: true, message: "Faculty updated successfully", data: faculty });
    } catch {
        res.status(500).json({ success: false, message: "Failed to update faculty" });
    }
};

export const deactivateFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const facultyId = req.params.facultyId as string;
        const result = await FacultyService.deactivateFaculty(facultyId);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "faculty", facultyId, "DELETE"
        );

        res.status(200).json({ success: true, message: "Faculty deactivated (login account disabled)", data: result });
    } catch {
        res.status(500).json({ success: false, message: "Failed to deactivate faculty" });
    }
};

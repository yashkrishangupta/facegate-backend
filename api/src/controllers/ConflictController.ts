import { Request, Response } from "express";
import * as ConflictService from "../services/ConflictService";

/**
 * Get All Conflicts
 */
export const getAllConflicts = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const { status, severity, conflict_type, room_id, from_date, to_date } = req.query;
        const conflicts = await ConflictService.getAllConflicts({
            status, severity, conflict_type, room_id, from_date, to_date
        });

        res.status(200).json({
            success: true,
            data: conflicts
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch conflicts"
        });

    }

};

/**
 * Get Conflict By ID
 */
export const getConflictById = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const conflictId = req.params.conflictId as string;

        const conflict =
            await ConflictService.getConflictById(conflictId);

        res.status(200).json({
            success: true,
            data: conflict
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch conflict"
        });

    }

};

/**
 * Create Conflict
 */
export const createConflict = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const conflict =
            await ConflictService.createConflict(req.body);

        res.status(201).json({
            success: true,
            message: "Conflict created successfully",
            data: conflict
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to create conflict"
        });

    }

};

/**
 * Resolve Conflict
 */
export const resolveConflict = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const conflictId = req.params.conflictId as string;

        const conflict =
            await ConflictService.resolveConflict(
                conflictId,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Conflict resolved successfully",
            data: conflict
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to resolve conflict"
        });

    }

};

/**
 * Delete Conflict
 */
export const deleteConflict = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const conflictId = req.params.conflictId as string;

        await ConflictService.deleteConflict(conflictId);

        res.status(200).json({
            success: true,
            message: "Conflict deleted successfully"
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to delete conflict"
        });

    }

};
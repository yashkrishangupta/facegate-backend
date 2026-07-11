import { Request, Response } from "express";
import * as ChangeLogService from "../services/ChangeLogService";

export const getAllChanges = async (req: Request, res: Response): Promise<void> => {
    try {
        const { entity_name, action, admin_id, from_date, to_date } = req.query;
        const changes = await ChangeLogService.getAllChanges({ entity_name, action, admin_id, from_date, to_date });
        res.status(200).json({ success: true, data: changes });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch change log" });
    }
};

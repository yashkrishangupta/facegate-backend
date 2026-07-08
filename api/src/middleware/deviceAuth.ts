import { Request, Response, NextFunction } from "express";
import pool from "../config/database";

/**
 * Device Authentication Middleware
 *
 * Validates the "x-api-key" header against device.device_token in Postgres.
 * On success, attaches the device row to req.device so downstream
 * controllers/services know which room this device belongs to.
 */
export const deviceAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {

    const apiKey = req.header("x-api-key");

    if (!apiKey) {
        res.status(401).json({
            success: false,
            message: "API Key missing"
        });
        return;
    }

    try {

        const result = await pool.query(
            `SELECT d.device_id,
                    d.device_identifier,
                    d.device_name,
                    d.device_status,
                    d.room_id,
                    r.room_number
             FROM device d
             JOIN room r ON r.room_id = d.room_id
             WHERE d.device_token = $1`,
            [apiKey]
        );

        const device = result.rows[0];

        if (!device) {
            res.status(401).json({
                success: false,
                message: "Invalid API Key"
            });
            return;
        }

        if (device.device_status !== "ACTIVE") {
            res.status(403).json({
                success: false,
                message: "Device is disabled"
            });
            return;
        }

        // Attach device information to the request
        (req as any).device = device;

        next();

    } catch (err) {
        console.error("Device auth error:", err);
        res.status(500).json({
            success: false,
            message: "Device authentication failed"
        });
    }

};
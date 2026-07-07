import { Request, Response, NextFunction } from "express";

/**
 * Mock Registered Devices
 */
const registeredDevices = [
    {
        deviceId: "DEV001",
        apiKey: "device-key-123",
        roomNumber: "LH101",
        status: "ACTIVE"
    },
    {
        deviceId: "DEV002",
        apiKey: "device-key-456",
        roomNumber: "LH102",
        status: "ACTIVE"
    },
    {
        deviceId: "DEV003",
        apiKey: "device-key-789",
        roomNumber: "LH201",
        status: "DISABLED"
    }
];

/**
 * Device Authentication Middleware
 */
export const deviceAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    const apiKey = req.header("x-api-key");

    if (!apiKey) {

        res.status(401).json({
            success: false,
            message: "API Key missing"
        });

        return;
    }

    const device = registeredDevices.find(
        d => d.apiKey === apiKey
    );

    if (!device) {

        res.status(401).json({
            success: false,
            message: "Invalid API Key"
        });

        return;
    }

    if (device.status !== "ACTIVE") {

        res.status(403).json({
            success: false,
            message: "Device is disabled"
        });

        return;
    }

    // Attach device information to the request
    (req as any).device = device;

    next();
};
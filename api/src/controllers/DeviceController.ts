import { Request, Response } from "express";
import * as DeviceService from "../services/DeviceService";

/**
 * Get All Devices
 */
export const getAllDevices = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const devices = await DeviceService.getAllDevices();

        res.status(200).json({
            success: true,
            data: devices
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch devices"
        });

    }

};

/**
 * Get Device By ID
 */
export const getDeviceById = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const deviceId = req.params.deviceId as string;

        const device = await DeviceService.getDeviceById(deviceId);

        res.status(200).json({
            success: true,
            data: device
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch device"
        });

    }

};

/**
 * Register Device
 */
export const registerDevice = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const device = await DeviceService.registerDevice(req.body);

        res.status(201).json({
            success: true,
            message: "Device registered successfully",
            data: device
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Device registration failed"
        });

    }

};

/**
 * Update Device
 */
export const updateDevice = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const deviceId = req.params.deviceId as string;

        const device = await DeviceService.updateDevice(
            deviceId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Device updated successfully",
            data: device
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update device"
        });

    }

};

/**
 * Device Heartbeat
 */
export const heartbeat = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        // deviceAuth middleware (now applied to this route) attaches the
        // authenticated device — use its ID rather than trusting whatever
        // deviceId the request body claims, which let any caller spoof
        // heartbeats for any device.
        const deviceId = (req as any).device.device_id;

        const response = await DeviceService.heartbeat({
            deviceId,
            batteryLevel: req.body.battery_level,
            storageAvailableMb: req.body.storage_available_mb,
            networkStatus: req.body.network_status
        });

        res.status(200).json({
            success: true,
            message: "Heartbeat received",
            data: response
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Heartbeat failed"
        });

    }

};

/**
 * Device Status
 */
export const getDeviceStatus = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const status = await DeviceService.getDeviceStatus();

        res.status(200).json({
            success: true,
            data: status
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch device status"
        });

    }

};

/**
 * Deactivate Device
 */
export const deactivateDevice = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const deviceId = req.params.deviceId as string;

        const result = await DeviceService.deactivateDevice(deviceId);

        res.status(200).json({
            success: true,
            message: "Device deactivated successfully",
            data: result
        });

    } catch (err) {

        console.error("Deactivate device error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to deactivate device"
        });

    }

};
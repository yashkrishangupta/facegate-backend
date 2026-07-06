import * as DeviceRepository from "../repositories/DeviceRepository";

/**
 * Get All Devices
 */
export const getAllDevices = async () => {
    return await DeviceRepository.getAllDevices();
};

/**
 * Get Device By ID
 */
export const getDeviceById = async (
    deviceId: string
) => {
    return await DeviceRepository.getDeviceById(deviceId);
};

/**
 * Register Device
 */
export const registerDevice = async (
    deviceData: any
) => {
    return await DeviceRepository.registerDevice(deviceData);
};

/**
 * Update Device
 */
export const updateDevice = async (
    deviceId: string,
    deviceData: any
) => {
    return await DeviceRepository.updateDevice(
        deviceId,
        deviceData
    );
};

/**
 * Heartbeat
 */
export const heartbeat = async (
    heartbeatData: any
) => {
    return await DeviceRepository.heartbeat(heartbeatData);
};

/**
 * Device Status
 */
export const getDeviceStatus = async () => {
    return await DeviceRepository.getDeviceStatus();
};
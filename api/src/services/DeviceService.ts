import * as DeviceRepository from "../repositories/DeviceRepository";

/**
 * Get All Devices
 */
export const getDeviceHealth = async (deviceId: string) => {
    return await DeviceRepository.getDeviceHealth(deviceId);
};

export const getDeviceSyncHistory = async (deviceId: string) => {
    return await DeviceRepository.getDeviceSyncHistory(deviceId);
};

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
 * Create a pending device + pairing code (admin action, website).
 */
export const createPendingDevice = async (
    deviceData: any
) => {

    if (!deviceData.room_id || !deviceData.device_name) {
        throw new Error("room_id and device_name are required");
    }

    const claimed = await DeviceRepository.roomHasClaimingDevice(deviceData.room_id);
    if (claimed) {
        throw new Error(
            "That room already has an active or pending device assigned to it. " +
            "Reassign or disable the existing device first."
        );
    }

    return await DeviceRepository.createPendingDevice(deviceData);
};

/**
 * Redeem a pairing code (device action, first app launch).
 */
export const redeemPairingCode = async (
    redeemData: any
) => {

    if (!redeemData.pairingCode) {
        throw new Error("pairingCode is required");
    }

    const device = await DeviceRepository.redeemPairingCode(redeemData);

    if (!device) {
        throw new Error("Invalid or expired pairing code");
    }

    return device;
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

/**
 * Deactivate Device
 */
export const deactivateDevice = async (
    deviceId: string
) => {
    return await DeviceRepository.deactivateDevice(deviceId);
};
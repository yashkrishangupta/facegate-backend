/**
 * Mock Device Repository
 */

let devices = [

    {
        deviceId: "D001",
        deviceName: "Tablet-LH101",
        room: "LH101",
        deviceType: "ANDROID_TABLET",
        status: "ONLINE",
        batteryLevel: 92,
        lastHeartbeat: "2026-07-06T10:15:00Z",
        appVersion: "1.0.0"
    },

    {
        deviceId: "D002",
        deviceName: "Tablet-LH102",
        room: "LH102",
        deviceType: "ANDROID_TABLET",
        status: "OFFLINE",
        batteryLevel: 45,
        lastHeartbeat: "2026-07-06T08:30:00Z",
        appVersion: "1.0.0"
    }

];

/**
 * Get All Devices
 */
export const getAllDevices = async () => {
    return devices;
};

/**
 * Get Device By ID
 */
export const getDeviceById = async (
    deviceId: string
) => {

    return devices.find(
        device => device.deviceId === deviceId
    );

};

/**
 * Register Device
 */
export const registerDevice = async (
    deviceData: any
) => {

    const newDevice = {
        deviceId: `D${String(devices.length + 1).padStart(3, "0")}`,
        status: "ONLINE",
        batteryLevel: 100,
        lastHeartbeat: new Date().toISOString(),
        ...deviceData
    };

    devices.push(newDevice);

    return newDevice;

};

/**
 * Update Device
 */
export const updateDevice = async (
    deviceId: string,
    deviceData: any
) => {

    const device = devices.find(
        d => d.deviceId === deviceId
    );

    if (!device) {
        return null;
    }

    Object.assign(device, deviceData);

    return device;

};

/**
 * Heartbeat
 */
export const heartbeat = async (
    heartbeatData: any
) => {

    const device = devices.find(
        d => d.deviceId === heartbeatData.deviceId
    );

    if (!device) {
        return {
            success: false,
            message: "Device not found"
        };
    }

    device.lastHeartbeat = new Date().toISOString();

    if (heartbeatData.batteryLevel !== undefined) {
        device.batteryLevel = heartbeatData.batteryLevel;
    }

    device.status = "ONLINE";

    return {
        success: true,
        device
    };

};

/**
 * Device Status
 */
export const getDeviceStatus = async () => {

    return {
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.status === "ONLINE").length,
        offlineDevices: devices.filter(d => d.status === "OFFLINE").length,
        devices
    };

};
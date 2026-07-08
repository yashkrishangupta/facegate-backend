import * as SyncRepository from "../repositories/SyncRepository";

export const fullSync = async (deviceId: string, roomId: string) => {
    return await SyncRepository.fullSync(deviceId, roomId);
};

export const incrementalSync = async (deviceId: string, roomId: string, since?: string) => {
    return await SyncRepository.incrementalSync(deviceId, roomId, since);
};

export const uploadAttendance = async (deviceId: string, attendanceData: any) => {
    return await SyncRepository.uploadAttendance(deviceId, attendanceData);
};

export const getSyncStatus = async (deviceId: string) => {
    return await SyncRepository.getSyncStatus(deviceId);
};

export const retrySync = async (deviceId: string, roomId: string) => {
    return await SyncRepository.retrySync(deviceId, roomId);
};
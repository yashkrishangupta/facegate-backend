import * as SyncRepository from "../repositories/SyncRepository";

export const fullSync = async () => {
    return await SyncRepository.fullSync();
};

export const incrementalSync = async () => {
    return await SyncRepository.incrementalSync();
};

export const uploadAttendance = async (attendanceData: any) => {
    return await SyncRepository.uploadAttendance(attendanceData);
};

export const getSyncStatus = async () => {
    return await SyncRepository.getSyncStatus();
};

export const retrySync = async () => {
    return await SyncRepository.retrySync();
};
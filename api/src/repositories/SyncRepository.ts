export const fullSync = async () => {

    return {
        students: 120,
        timetable: 36,
        devices: 5,
        holidays: 10,
        lastSync: "2026-07-06 10:30:00"
    };

};

export const incrementalSync = async () => {

    return {
        updatedStudents: 3,
        updatedTimetable: 1,
        updatedDevices: 0,
        lastSync: "2026-07-06 12:15:00"
    };

};

export const uploadAttendance = async (attendanceData: any) => {

    return {
        uploadedRecords: attendanceData?.length || 1,
        status: "SUCCESS"
    };

};

export const getSyncStatus = async () => {

    return {
        deviceStatus: "ONLINE",
        syncStatus: "SUCCESS",
        lastSync: "2026-07-06 12:15:00"
    };

};

export const retrySync = async () => {

    return {
        retried: true,
        status: "SUCCESS"
    };

};
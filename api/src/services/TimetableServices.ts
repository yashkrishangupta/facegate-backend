import * as TimetableRepository from "../repositories/TimetableRepository";

/**
 * Get All Timetable
 */
export const getAllTimetable = async () => {
    return await TimetableRepository.getAllTimetable();
};

/**
 * Get Today's Timetable
 */
export const getTodayTimetable = async () => {
    return await TimetableRepository.getTodayTimetable();
};

/**
 * Get Timetable by Batch
 */
export const getTimetableByBatch = async (
    batchId: string
) => {
    return await TimetableRepository.getTimetableByBatch(batchId);
};

/**
 * Get Timetable by Faculty
 */
export const getTimetableByFaculty = async (
    facultyId: string
) => {
    return await TimetableRepository.getTimetableByFaculty(facultyId);
};

/**
 * Create Timetable
 */
export const createTimetable = async (
    timetableData: any
) => {
    return await TimetableRepository.createTimetable(timetableData);
};

/**
 * Update Timetable
 */
export const updateTimetable = async (
    timetableId: string,
    timetableData: any
) => {
    return await TimetableRepository.updateTimetable(
        timetableId,
        timetableData
    );
};

/**
 * Delete Timetable
 */
export const deleteTimetable = async (
    timetableId: string
) => {
    return await TimetableRepository.deleteTimetable(timetableId);
};
import * as TimetableRepository from "../repositories/TimetableRepository";

/**
 * Get All Timetable, optionally filtered by academic year / program /
 * semester / batch / room.
 */
export const getAllTimetable = async (filters: any = {}) => {
    const hasFilters = Object.values(filters).some(v => v);
    return hasFilters
        ? await TimetableRepository.getFilteredTimetable(filters)
        : await TimetableRepository.getAllTimetable();
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
    const required = [
        "batch_id", "faculty_id", "subject_id", "room_id", "day_of_week",
        "lecture_number", "start_time", "end_time"
    ];
    for (const field of required) {
        if (timetableData[field] === undefined || timetableData[field] === null || timetableData[field] === "") {
            throw new Error(`${field} is required`);
        }
    }

    // effective_from is NOT NULL at the DB level with no default — the
    // Add Period form doesn't ask for it (most periods are effective
    // immediately), so default it here rather than forcing every admin
    // to pick a start date for the common case.
    const dataWithDefaults = {
        ...timetableData,
        effective_from: timetableData.effective_from || new Date().toISOString().slice(0, 10)
    };

    // The DB's own unique constraint only catches a clash for the SAME
    // batch — this catches a different batch double-booking the same room
    // or the same faculty member at an overlapping time.
    const clash = await TimetableRepository.findSchedulingClash({
        room_id: dataWithDefaults.room_id,
        faculty_id: dataWithDefaults.faculty_id,
        day_of_week: dataWithDefaults.day_of_week,
        start_time: dataWithDefaults.start_time,
        end_time: dataWithDefaults.end_time
    });
    if (clash) {
        throw new Error(
            clash.clash_type === "room"
                ? `Room is already booked for batch ${clash.batch_code} at this day/time`
                : `Faculty is already teaching batch ${clash.batch_code} at this day/time`
        );
    }

    return await TimetableRepository.createTimetable(dataWithDefaults);
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
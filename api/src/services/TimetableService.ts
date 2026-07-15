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

    // Checked first and separately from the time-overlap clash below:
    // reusing a lecture_number for this batch/day is invalid even if the
    // new time doesn't actually overlap the existing one — that's what
    // uq_timetable_slot_active enforces at the DB level, and this is what
    // turns hitting it into a message that says what's wrong instead of a
    // raw constraint-name error.
    const lectureClash = await TimetableRepository.findLectureNumberClash({
        batch_id: dataWithDefaults.batch_id,
        day_of_week: dataWithDefaults.day_of_week,
        lecture_number: Number(dataWithDefaults.lecture_number)
    });
    if (lectureClash) {
        throw new Error(
            `This batch already has lecture ${dataWithDefaults.lecture_number} on ${dataWithDefaults.day_of_week}`
            + ` (${lectureClash.subject_name}, ${lectureClash.start_time}–${lectureClash.end_time})`
            + ` — pick a different lecture number.`
        );
    }

    // Checks all three clash types with a real time-interval comparison —
    // same batch double-booked (regardless of lecture_number), a different
    // batch double-booking the same room, or the same faculty member
    // teaching two batches at once.
    const clash = await TimetableRepository.findSchedulingClash({
        batch_id: dataWithDefaults.batch_id,
        room_id: dataWithDefaults.room_id,
        faculty_id: dataWithDefaults.faculty_id,
        day_of_week: dataWithDefaults.day_of_week,
        start_time: dataWithDefaults.start_time,
        end_time: dataWithDefaults.end_time
    });
    if (clash) {
        throw new Error(
            clash.clash_type === "batch"
                ? `This batch already has a period at an overlapping day/time`
                : clash.clash_type === "room"
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
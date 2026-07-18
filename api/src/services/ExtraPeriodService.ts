import * as ExtraPeriodRepository from "../repositories/ExtraPeriodRepository";

/**
 * Extra Period Service
 *
 * Contains all business logic for the "Extra Period for One Week" feature.
 * Change-log writes are handled in the controller (matching the existing
 * BatchController pattern where ChangeLogRepository.recordChange is called
 * directly from the controller using req.user?.adminId).
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Returns the Monday of the ISO week that contains `date` (UTC).
 * Used to normalise week_start_date so callers may pass any date in the
 * target week rather than having to compute the Monday themselves.
 */
const getMondayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
};

/** Format a Date as "YYYY-MM-DD" (UTC). */
const toDateString = (d: Date): string => d.toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/*  Read                                                                */
/* ------------------------------------------------------------------ */

export const getAllExtraPeriods = async (filters: {
    faculty_id?:      string;
    batch_id?:        string;
    week_start_date?: string;
}) => {
    return await ExtraPeriodRepository.getAllExtraPeriods(filters);
};

export const getExtraPeriodById = async (extraPeriodId: string) => {
    return await ExtraPeriodRepository.getExtraPeriodById(extraPeriodId);
};

/* ------------------------------------------------------------------ */
/*  Create                                                              */
/* ------------------------------------------------------------------ */

export const createExtraPeriod = async (data: any) => {
    // Required field validation — same style as TimetableService.createTimetable.
    const required = [
        "faculty_id", "batch_id", "subject_id", "room_id",
        "week_start_date", "day_of_week", "lecture_number",
        "start_time", "end_time"
    ];
    for (const field of required) {
        if (data[field] === undefined || data[field] === null || data[field] === "") {
            throw new Error(`${field} is required`);
        }
    }

    // Normalise week window: anchor to Monday of the supplied week.
    const monday = getMondayOfWeek(new Date(data.week_start_date));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const payload = {
        ...data,
        week_start_date:  toDateString(monday),
        week_end_date:    toDateString(sunday),
        lecture_number:   Number(data.lecture_number),
        attendance_window_minutes: data.attendance_window_minutes ?? 15
    };

    // Clash check — mirrors TimetableService.createTimetable's approach.
    const clash = await ExtraPeriodRepository.findExtraPeriodClash({
        batch_id:        payload.batch_id,
        room_id:         payload.room_id,
        faculty_id:      payload.faculty_id,
        week_start_date: payload.week_start_date,
        day_of_week:     payload.day_of_week,
        start_time:      payload.start_time,
        end_time:        payload.end_time
    });

    if (clash) {
        const source = clash.source === "timetable"
            ? "permanent timetable"
            : "another extra period";
        throw new Error(
            clash.clash_type === "batch"
                ? `This batch already has a period at an overlapping day/time in the ${source}`
                : clash.clash_type === "room"
                    ? `Room is already booked for batch ${clash.batch_code} at this day/time in the ${source}`
                    : `Faculty is already teaching batch ${clash.batch_code} at this day/time in the ${source}`
        );
    }

    return await ExtraPeriodRepository.createExtraPeriod(payload);
};

/* ------------------------------------------------------------------ */
/*  Update                                                              */
/* ------------------------------------------------------------------ */

export const updateExtraPeriod = async (
    extraPeriodId: string,
    data: any
) => {
    const existing = await ExtraPeriodRepository.getExtraPeriodById(extraPeriodId);
    if (!existing) {
        throw new Error("Extra period not found");
    }

    // Normalise week window if the caller is changing it.
    if (data.week_start_date) {
        const monday = getMondayOfWeek(new Date(data.week_start_date));
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
        data.week_start_date = toDateString(monday);
        data.week_end_date   = toDateString(sunday);
    }

    if (data.lecture_number !== undefined) {
        data.lecture_number = Number(data.lecture_number);
    }

    // Clash check against the merged (existing + incoming) picture.
    const merged = { ...existing, ...data };

    const clash = await ExtraPeriodRepository.findExtraPeriodClash({
        batch_id:                merged.batch_id,
        room_id:                 merged.room_id,
        faculty_id:              merged.faculty_id,
        week_start_date:         merged.week_start_date,
        day_of_week:             merged.day_of_week,
        start_time:              merged.start_time,
        end_time:                merged.end_time,
        exclude_extra_period_id: extraPeriodId
    });

    if (clash) {
        const source = clash.source === "timetable"
            ? "permanent timetable"
            : "another extra period";
        throw new Error(
            clash.clash_type === "batch"
                ? `This batch already has a period at an overlapping day/time in the ${source}`
                : clash.clash_type === "room"
                    ? `Room is already booked for batch ${clash.batch_code} at this day/time in the ${source}`
                    : `Faculty is already teaching batch ${clash.batch_code} at this day/time in the ${source}`
        );
    }

    return await ExtraPeriodRepository.updateExtraPeriod(extraPeriodId, data);
};

/* ------------------------------------------------------------------ */
/*  Delete                                                              */
/* ------------------------------------------------------------------ */

export const deleteExtraPeriod = async (extraPeriodId: string) => {
    const existing = await ExtraPeriodRepository.getExtraPeriodById(extraPeriodId);
    if (!existing) {
        throw new Error("Extra period not found");
    }
    return await ExtraPeriodRepository.deleteExtraPeriod(extraPeriodId);
};

import pool from "../config/database";

/**
 * Extra Period Repository
 *
 * Backed by the `extra_period` table.  Every SELECT joins the same master
 * tables as TimetableRepository.SELECT_TIMETABLE so callers receive readable
 * names alongside the raw UUIDs.
 */

const SELECT_EXTRA_PERIOD = `
    SELECT
        ep.extra_period_id,
        ep.faculty_id,
        f.first_name || ' ' || f.last_name  AS faculty_name,
        ep.batch_id,
        b.batch_code,
        b.academic_year,
        b.semester                           AS batch_semester,
        b.program_id,
        pr.program_name                      AS program,
        ep.subject_id,
        sub.subject_code,
        sub.subject_name,
        ep.room_id,
        r.room_number                        AS room,
        ep.week_start_date,
        ep.week_end_date,
        ep.day_of_week,
        ep.lecture_number,
        ep.start_time,
        ep.end_time,
        ep.attendance_window_minutes,
        ep.is_active,
        ep.created_at,
        ep.updated_at
    FROM extra_period ep
    JOIN faculty  f   ON f.faculty_id   = ep.faculty_id
    JOIN batch    b   ON b.batch_id     = ep.batch_id
    JOIN program  pr  ON pr.program_id  = b.program_id
    JOIN subject  sub ON sub.subject_id = ep.subject_id
    JOIN room     r   ON r.room_id      = ep.room_id
`;

/* ------------------------------------------------------------------ */
/*  READ                                                                */
/* ------------------------------------------------------------------ */

export const getAllExtraPeriods = async (filters: {
    faculty_id?:      string;
    batch_id?:        string;
    week_start_date?: string;
}) => {
    const conditions = ["ep.is_active = TRUE"];
    const values: any[] = [];

    if (filters.faculty_id) {
        values.push(filters.faculty_id);
        conditions.push(`ep.faculty_id = $${values.length}`);
    }
    if (filters.batch_id) {
        values.push(filters.batch_id);
        conditions.push(`ep.batch_id = $${values.length}`);
    }
    if (filters.week_start_date) {
        values.push(filters.week_start_date);
        conditions.push(`ep.week_start_date = $${values.length}`);
    }

    const result = await pool.query(
        `${SELECT_EXTRA_PERIOD}
         WHERE ${conditions.join(" AND ")}
         ORDER BY ep.week_start_date, ep.day_of_week, ep.start_time`,
        values
    );
    return result.rows;
};

export const getExtraPeriodById = async (extraPeriodId: string) => {
    const result = await pool.query(
        `${SELECT_EXTRA_PERIOD} WHERE ep.extra_period_id = $1`,
        [extraPeriodId]
    );
    return result.rows[0] || null;
};

/* ------------------------------------------------------------------ */
/*  CLASH DETECTION                                                     */
/* ------------------------------------------------------------------ */

/**
 * Checks whether the proposed extra period overlaps (by real time interval)
 * with any existing active record for the same room, faculty, or batch on
 * the same day — in either:
 *   1. the `extra_period` table for the same week_start_date, or
 *   2. the permanent `timetable` table (which repeats every week).
 *
 * Returns the first clash row found, or null.
 * Pass `exclude_extra_period_id` when updating so the row being edited
 * does not clash with itself.
 */
export const findExtraPeriodClash = async (params: {
    batch_id:                string;
    room_id:                 string;
    faculty_id:              string;
    week_start_date:         string;
    day_of_week:             string;
    start_time:              string;
    end_time:                string;
    exclude_extra_period_id?: string;
}) => {
    const {
        batch_id, room_id, faculty_id,
        week_start_date, day_of_week,
        start_time, end_time,
        exclude_extra_period_id
    } = params;

    // 1. Check against other active extra periods in the same week.
    const epResult = await pool.query(
        `SELECT ep.extra_period_id,
                b.batch_code,
                CASE
                    WHEN ep.batch_id  = $1 THEN 'batch'
                    WHEN ep.room_id   = $2 THEN 'room'
                    ELSE 'faculty'
                END AS clash_type
         FROM extra_period ep
         JOIN batch b ON b.batch_id = ep.batch_id
         WHERE ep.is_active       = TRUE
           AND ep.week_start_date = $3
           AND ep.day_of_week     = $4
           AND (ep.batch_id = $1 OR ep.room_id = $2 OR ep.faculty_id = $5)
           AND ep.start_time < $7
           AND ep.end_time   > $6
           AND ($8::uuid IS NULL OR ep.extra_period_id != $8)
         LIMIT 1`,
        [
            batch_id, room_id, week_start_date, day_of_week,
            faculty_id, start_time, end_time,
            exclude_extra_period_id ?? null
        ]
    );
    if (epResult.rows[0]) {
        return { ...epResult.rows[0], source: "extra_period" };
    }

    // 2. Check against the permanent timetable on the same day_of_week.
    //    Permanent slots repeat every week, so any day match is a conflict.
    const ttResult = await pool.query(
        `SELECT t.timetable_id,
                b.batch_code,
                CASE
                    WHEN t.batch_id  = $1 THEN 'batch'
                    WHEN t.room_id   = $2 THEN 'room'
                    ELSE 'faculty'
                END AS clash_type
         FROM timetable t
         JOIN batch b ON b.batch_id = t.batch_id
         WHERE t.is_active    = TRUE
           AND t.day_of_week  = $3
           AND (t.batch_id = $1 OR t.room_id = $2 OR t.faculty_id = $4)
           AND t.start_time < $6
           AND t.end_time   > $5
         LIMIT 1`,
        [batch_id, room_id, day_of_week, faculty_id, start_time, end_time]
    );
    if (ttResult.rows[0]) {
        return { ...ttResult.rows[0], source: "timetable" };
    }

    return null;
};

/* ------------------------------------------------------------------ */
/*  WRITE                                                               */
/* ------------------------------------------------------------------ */

export const createExtraPeriod = async (data: {
    faculty_id:               string;
    batch_id:                 string;
    subject_id:               string;
    room_id:                  string;
    week_start_date:          string;
    week_end_date:            string;
    day_of_week:              string;
    lecture_number:           number;
    start_time:               string;
    end_time:                 string;
    attendance_window_minutes?: number;
}) => {
    const result = await pool.query(
        `INSERT INTO extra_period
            (faculty_id, batch_id, subject_id, room_id,
             week_start_date, week_end_date,
             day_of_week, lecture_number, start_time, end_time,
             attendance_window_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
            data.faculty_id, data.batch_id, data.subject_id, data.room_id,
            data.week_start_date, data.week_end_date,
            data.day_of_week, data.lecture_number,
            data.start_time, data.end_time,
            data.attendance_window_minutes ?? 15
        ]
    );
    return result.rows[0];
};

export const updateExtraPeriod = async (
    extraPeriodId: string,
    data: any
) => {
    const allowedFields = [
        "faculty_id", "batch_id", "subject_id", "room_id",
        "week_start_date", "week_end_date",
        "day_of_week", "lecture_number",
        "start_time", "end_time",
        "attendance_window_minutes", "is_active"
    ];

    const fields = Object.keys(data).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return await getExtraPeriodById(extraPeriodId);
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values    = fields.map(f => data[f]);

    const result = await pool.query(
        `UPDATE extra_period
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE extra_period_id = $1
         RETURNING *`,
        [extraPeriodId, ...values]
    );
    return result.rows[0] || null;
};

/**
 * Soft-delete — mirrors TimetableRepository.deleteTimetable exactly.
 */
export const deleteExtraPeriod = async (extraPeriodId: string) => {
    const result = await pool.query(
        `UPDATE extra_period
         SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE extra_period_id = $1
         RETURNING extra_period_id`,
        [extraPeriodId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

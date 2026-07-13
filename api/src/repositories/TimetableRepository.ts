import pool from "../config/database";

/**
 * Timetable Repository
 * Backed by the `timetable` table, joined with batch/faculty/subject/room
 * so callers get readable names, not just foreign key UUIDs.
 */

const SELECT_TIMETABLE = `
    SELECT
        t.timetable_id,
        t.batch_id,
        b.batch_code,
        b.academic_year,
        b.program_id,
        pr.program_name AS program,
        b.semester AS batch_semester,
        t.faculty_id,
        f.first_name || ' ' || f.last_name AS faculty_name,
        t.subject_id,
        sub.subject_code,
        sub.subject_name,
        t.room_id,
        r.room_number AS room,
        t.day_of_week AS day,
        t.lecture_number,
        t.start_time,
        t.end_time,
        t.attendance_window_minutes,
        t.effective_from,
        t.effective_to,
        t.is_active
    FROM timetable t
    JOIN batch b ON b.batch_id = t.batch_id
    JOIN program pr ON pr.program_id = b.program_id
    JOIN faculty f ON f.faculty_id = t.faculty_id
    JOIN subject sub ON sub.subject_id = t.subject_id
    JOIN room r ON r.room_id = t.room_id
`;

export const getAllTimetable = async () => {
    const result = await pool.query(
        `${SELECT_TIMETABLE} WHERE t.is_active = TRUE ORDER BY t.day_of_week, t.start_time`
    );
    return result.rows;
};

/**
 * Filtered list — backs the Timetable page's Academic Year / Program /
 * Semester / Batch / Room filter row.
 */
export const getFilteredTimetable = async (filters: {
    academic_year?: string;
    program_id?: string;
    semester?: string;
    batch_id?: string;
    room_id?: string;
}) => {
    const conditions = ["t.is_active = TRUE"];
    const values: any[] = [];

    if (filters.academic_year) { values.push(filters.academic_year); conditions.push(`b.academic_year = $${values.length}`); }
    if (filters.program_id) { values.push(filters.program_id); conditions.push(`b.program_id = $${values.length}`); }
    if (filters.semester) { values.push(filters.semester); conditions.push(`b.semester = $${values.length}`); }
    if (filters.batch_id) { values.push(filters.batch_id); conditions.push(`t.batch_id = $${values.length}`); }
    if (filters.room_id) { values.push(filters.room_id); conditions.push(`t.room_id = $${values.length}`); }

    const result = await pool.query(
        `${SELECT_TIMETABLE} WHERE ${conditions.join(" AND ")} ORDER BY t.day_of_week, t.start_time`,
        values
    );
    return result.rows;
};

export const getTodayTimetable = async () => {
    // day_of_week is stored as text (e.g. 'MONDAY'); derive today's name in JS
    // so the query stays timezone-consistent with the rest of the app.
    const today = new Date()
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase();

    const result = await pool.query(
        `${SELECT_TIMETABLE} WHERE t.is_active = TRUE AND UPPER(t.day_of_week) = $1
         ORDER BY t.start_time`,
        [today]
    );
    return result.rows;
};

export const getTimetableByBatch = async (batchId: string) => {
    const result = await pool.query(
        `${SELECT_TIMETABLE} WHERE t.batch_id = $1 AND t.is_active = TRUE
         ORDER BY t.day_of_week, t.start_time`,
        [batchId]
    );
    return result.rows;
};

export const getTimetableByFaculty = async (facultyId: string) => {
    const result = await pool.query(
        `${SELECT_TIMETABLE} WHERE t.faculty_id = $1 AND t.is_active = TRUE
         ORDER BY t.day_of_week, t.start_time`,
        [facultyId]
    );
    return result.rows;
};

/**
 * Finds any OTHER batch's period that overlaps this room or faculty member
 * at the same day/time. The existing DB constraint only catches a clash for
 * the *same* batch — this catches the room/faculty case, which nothing else
 * guards against.
 */
export const findSchedulingClash = async (params: {
    room_id: string;
    faculty_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    exclude_timetable_id?: string;
}) => {
    const { room_id, faculty_id, day_of_week, start_time, end_time, exclude_timetable_id } = params;

    const result = await pool.query(
        `SELECT t.timetable_id, t.room_id, t.faculty_id, b.batch_code,
                CASE WHEN t.room_id = $1 THEN 'room' ELSE 'faculty' END AS clash_type
         FROM timetable t
         JOIN batch b ON b.batch_id = t.batch_id
         WHERE t.is_active = TRUE
           AND t.day_of_week = $3
           AND (t.room_id = $1 OR t.faculty_id = $2)
           AND t.start_time < $5
           AND t.end_time > $4
           AND ($6::uuid IS NULL OR t.timetable_id != $6)
         LIMIT 1`,
        [room_id, faculty_id, day_of_week, start_time, end_time, exclude_timetable_id ?? null]
    );

    return result.rows[0] || null;
};

export const createTimetable = async (timetableData: any) => {

    const {
        batch_id, faculty_id, subject_id, room_id, day_of_week,
        lecture_number, start_time, end_time, attendance_window_minutes,
        effective_from, effective_to
    } = timetableData;

    const result = await pool.query(
        `INSERT INTO timetable
            (batch_id, faculty_id, subject_id, room_id, day_of_week,
             lecture_number, start_time, end_time, attendance_window_minutes,
             effective_from, effective_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
            batch_id, faculty_id, subject_id, room_id, day_of_week,
            lecture_number, start_time, end_time,
            attendance_window_minutes ?? 15,
            effective_from, effective_to ?? null
        ]
    );

    return result.rows[0];
};

export const updateTimetable = async (
    timetableId: string,
    timetableData: any
) => {

    const allowedFields = [
        "batch_id", "faculty_id", "subject_id", "room_id", "day_of_week",
        "lecture_number", "start_time", "end_time", "attendance_window_minutes",
        "effective_from", "effective_to", "is_active"
    ];

    const fields = Object.keys(timetableData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        const result = await pool.query(
            `${SELECT_TIMETABLE} WHERE t.timetable_id = $1`,
            [timetableId]
        );
        return result.rows[0] || null;
    }

    const setClause = fields
        .map((field, i) => `${field} = $${i + 2}`)
        .join(", ");

    const values = fields.map(f => timetableData[f]);

    const result = await pool.query(
        `UPDATE timetable
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE timetable_id = $1
         RETURNING *`,
        [timetableId, ...values]
    );

    return result.rows[0] || null;
};

export const deleteTimetable = async (timetableId: string) => {
    const result = await pool.query(
        `UPDATE timetable SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE timetable_id = $1
         RETURNING timetable_id`,
        [timetableId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

import pool from "../config/database";

const SELECT_CALENDAR = `
    SELECT calendar_id, calendar_date, academic_year, semester,
           is_working_day, event_type, event_name, description,
           is_active, created_at, updated_at
    FROM academic_calendar
`;

export const getAllCalendarEntries = async (filters: { academic_year?: string; semester?: string }) => {
    const conditions = ["is_active = TRUE"];
    const values: any[] = [];
    if (filters.academic_year) { values.push(filters.academic_year); conditions.push(`academic_year = $${values.length}`); }
    if (filters.semester) { values.push(filters.semester); conditions.push(`semester = $${values.length}`); }
    const result = await pool.query(
        `${SELECT_CALENDAR} WHERE ${conditions.join(" AND ")} ORDER BY calendar_date`,
        values
    );
    return result.rows;
};

export const getCalendarEntryById = async (calendarId: string) => {
    const result = await pool.query(`${SELECT_CALENDAR} WHERE calendar_id = $1`, [calendarId]);
    return result.rows[0];
};

export const createCalendarEntry = async (data: any) => {
    const { calendar_date, academic_year, semester, is_working_day, event_type, event_name, description } = data;
    const result = await pool.query(
        `INSERT INTO academic_calendar
            (calendar_date, academic_year, semester, is_working_day, event_type, event_name, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            calendar_date, academic_year, semester, is_working_day ?? true,
            event_type ?? "WORKING_DAY", event_name ?? null, description ?? null
        ]
    );
    return result.rows[0];
};

export const updateCalendarEntry = async (calendarId: string, data: any) => {
    const allowed = ["calendar_date", "academic_year", "semester", "is_working_day", "event_type", "event_name", "description"];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return getCalendarEntryById(calendarId);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map(f => data[f]);
    const result = await pool.query(
        `UPDATE academic_calendar SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE calendar_id = $1 RETURNING *`,
        [calendarId, ...values]
    );
    return result.rows[0];
};

export const deactivateCalendarEntry = async (calendarId: string) => {
    const result = await pool.query(
        `UPDATE academic_calendar SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE calendar_id = $1 RETURNING calendar_id`,
        [calendarId]
    );
    return { success: (result.rowCount ?? 0) > 0 };
};

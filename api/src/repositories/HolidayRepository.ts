import pool from "../config/database";

/**
 * Holiday Repository
 * Backed by the `holiday` table, which points at a row in
 * `academic_calendar` (that's where the actual date lives). Creating a
 * holiday upserts the calendar day (marking it non-working) and then
 * inserts the holiday record against it.
 */

const SELECT_HOLIDAY = `
    SELECT
        h.holiday_id,
        h.calendar_id,
        ac.calendar_date AS holiday_date,
        h.holiday_name,
        h.holiday_type,
        h.description,
        h.is_recurring,
        h.created_by,
        h.is_active
    FROM holiday h
    JOIN academic_calendar ac ON ac.calendar_id = h.calendar_id
`;

export const getAllHolidays = async () => {
    const result = await pool.query(
        `${SELECT_HOLIDAY} WHERE h.is_active = TRUE ORDER BY ac.calendar_date`
    );
    return result.rows;
};

export const getHolidayById = async (holidayId: string) => {
    const result = await pool.query(
        `${SELECT_HOLIDAY} WHERE h.holiday_id = $1`,
        [holidayId]
    );
    return result.rows[0];
};

export const createHoliday = async (holidayData: any) => {

    const {
        holiday_date,
        holiday_name,
        holiday_type,
        description,
        is_recurring,
        created_by,
        academic_year,
        semester
    } = holidayData;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Upsert the calendar day first — calendar_date is UNIQUE, so if this
        // date already exists (e.g. was a normal working day) we just flip it.
        const calendarResult = await client.query(
            `INSERT INTO academic_calendar
                (calendar_date, academic_year, semester, is_working_day, event_type, event_name, description)
             VALUES ($1, $2, $3, FALSE, 'HOLIDAY', $4, $5)
             ON CONFLICT (calendar_date)
             DO UPDATE SET
                is_working_day = FALSE,
                event_type = 'HOLIDAY',
                event_name = EXCLUDED.event_name,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP
             RETURNING calendar_id`,
            [
                holiday_date,
                academic_year,
                semester,
                holiday_name,
                description ?? null
            ]
        );

        const calendar_id = calendarResult.rows[0].calendar_id;

        const holidayResult = await client.query(
            `INSERT INTO holiday
                (calendar_id, holiday_name, holiday_type, description, is_recurring, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                calendar_id,
                holiday_name,
                holiday_type,
                description ?? null,
                is_recurring ?? false,
                created_by ?? null
            ]
        );

        await client.query("COMMIT");

        return holidayResult.rows[0];

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

export const updateHoliday = async (
    holidayId: string,
    holidayData: any
) => {

    const allowedFields = ["holiday_name", "holiday_type", "description", "is_recurring"];
    const fields = Object.keys(holidayData).filter(k => allowedFields.includes(k));

    if (fields.length === 0) {
        return getHolidayById(holidayId);
    }

    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
    const values = fields.map(f => holidayData[f]);

    const result = await pool.query(
        `UPDATE holiday
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE holiday_id = $1
         RETURNING *`,
        [holidayId, ...values]
    );

    return result.rows[0] || null;
};

export const deleteHoliday = async (holidayId: string) => {
    const result = await pool.query(
        `UPDATE holiday SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE holiday_id = $1
         RETURNING holiday_id`,
        [holidayId]
    );
    return { success: result.rowCount !== null && result.rowCount > 0 };
};

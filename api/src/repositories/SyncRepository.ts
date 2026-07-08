import pool from "../config/database";

/**
 * Sync Repository — the core pull/push loop described in the architecture
 * doc, Section 4. Every device pulls only the timetable/students/holidays
 * relevant to its own room, and pushes attendance back up idempotently.
 */

const logSync = async (
    deviceId: string,
    syncType: string,
    startedAt: Date,
    result: { downloaded: number; uploaded: number; failed: number; error?: string }
) => {
    await pool.query(
        `INSERT INTO device_sync_log
            (device_id, sync_type, sync_status, sync_start_time, sync_end_time,
             records_uploaded, records_downloaded, failed_records, error_message)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8)`,
        [
            deviceId,
            syncType,
            result.error ? "FAILED" : "SUCCESS",
            startedAt,
            result.uploaded,
            result.downloaded,
            result.failed,
            result.error ?? null
        ]
    );

    await pool.query(
        `UPDATE device SET last_sync = CURRENT_TIMESTAMP WHERE device_id = $1`,
        [deviceId]
    );
};

/**
 * Pulls everything relevant to a device's room: timetable rows taught in
 * this room, students belonging to batches that have classes in this room,
 * and all active holidays (holidays are global, not room-specific).
 */
const pullForRoom = async (roomId: string, since?: string) => {

    const sinceClause = since ? "AND t.updated_at > $2" : "";
    const timetableParams = since ? [roomId, since] : [roomId];

    const timetable = await pool.query(
        `SELECT t.timetable_id, t.batch_id, t.faculty_id, t.subject_id, t.room_id,
                t.day_of_week, t.lecture_number, t.start_time, t.end_time,
                t.attendance_window_minutes, t.effective_from, t.effective_to,
                t.updated_at
         FROM timetable t
         WHERE t.room_id = $1 AND t.is_active = TRUE ${sinceClause}`,
        timetableParams
    );

    const studentSinceClause = since ? "AND s.updated_at > $2" : "";
    const studentParams = since ? [roomId, since] : [roomId];

    const students = await pool.query(
        `SELECT DISTINCT s.student_id, s.batch_id, s.registration_number,
                s.roll_number, s.first_name, s.last_name, s.email, s.phone,
                s.gender, s.student_status, s.updated_at
         FROM student s
         WHERE s.is_active = TRUE
           AND s.batch_id IN (
               SELECT DISTINCT batch_id FROM timetable
               WHERE room_id = $1 AND is_active = TRUE
           )
           ${studentSinceClause}`,
        studentParams
    );

    const holidaySinceClause = since ? "AND h.updated_at > $1" : "";
    const holidayParams = since ? [since] : [];

    const holidays = await pool.query(
        `SELECT h.holiday_id, ac.calendar_date AS holiday_date, h.holiday_name,
                h.holiday_type, h.is_recurring, h.updated_at
         FROM holiday h
         JOIN academic_calendar ac ON ac.calendar_id = h.calendar_id
         WHERE h.is_active = TRUE ${holidaySinceClause}`,
        holidayParams
    );

    return {
        timetable: timetable.rows,
        students: students.rows,
        holidays: holidays.rows
    };
};

export const fullSync = async (deviceId: string, roomId: string) => {

    const startedAt = new Date();

    try {
        const data = await pullForRoom(roomId);

        await logSync(deviceId, "FULL", startedAt, {
            downloaded: data.timetable.length + data.students.length + data.holidays.length,
            uploaded: 0,
            failed: 0
        });

        return { ...data, lastSync: new Date().toISOString() };

    } catch (err: any) {
        await logSync(deviceId, "FULL", startedAt, { downloaded: 0, uploaded: 0, failed: 0, error: err.message });
        throw err;
    }
};

export const incrementalSync = async (deviceId: string, roomId: string, since?: string) => {

    const startedAt = new Date();

    try {
        const data = await pullForRoom(roomId, since);

        await logSync(deviceId, "INCREMENTAL", startedAt, {
            downloaded: data.timetable.length + data.students.length + data.holidays.length,
            uploaded: 0,
            failed: 0
        });

        return {
            updatedTimetable: data.timetable.length,
            updatedStudents: data.students.length,
            updatedHolidays: data.holidays.length,
            timetable: data.timetable,
            students: data.students,
            holidays: data.holidays,
            lastSync: new Date().toISOString()
        };

    } catch (err: any) {
        await logSync(deviceId, "INCREMENTAL", startedAt, { downloaded: 0, uploaded: 0, failed: 0, error: err.message });
        throw err;
    }
};

/**
 * Batched, idempotent attendance push. Upserts on (session_id, student_id) —
 * safe to retry from a device with a shaky connection.
 */
export const uploadAttendance = async (deviceId: string, attendanceData: any) => {

    const startedAt = new Date();
    const records: any[] = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData?.records ?? [];

    let uploaded = 0;
    let failed = 0;

    for (const record of records) {
        try {
            await pool.query(
                `INSERT INTO attendance
                    (attendance_session_id, student_id, device_id, attendance_status,
                     attendance_mode, recognition_confidence, attendance_time, synced)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                 ON CONFLICT ON CONSTRAINT uq_student_session
                 DO UPDATE SET
                    attendance_status = EXCLUDED.attendance_status,
                    attendance_mode = EXCLUDED.attendance_mode,
                    recognition_confidence = EXCLUDED.recognition_confidence,
                    attendance_time = EXCLUDED.attendance_time,
                    synced = TRUE,
                    synced_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    record.session_id,
                    record.student_id,
                    deviceId,
                    record.status ?? "PRESENT",
                    record.attendance_mode ?? "FACE_RECOGNITION",
                    record.confidence ?? null,
                    record.timestamp ?? new Date().toISOString()
                ]
            );
            uploaded++;
        } catch (err) {
            console.error("Attendance upload row failed:", err);
            failed++;
        }
    }

    await logSync(deviceId, "ATTENDANCE_UPLOAD", startedAt, {
        downloaded: 0,
        uploaded,
        failed
    });

    return { uploadedRecords: uploaded, failedRecords: failed, status: failed === 0 ? "SUCCESS" : "PARTIAL" };
};

export const getSyncStatus = async (deviceId: string) => {

    const deviceResult = await pool.query(
        `SELECT device_status, network_status, last_sync FROM device WHERE device_id = $1`,
        [deviceId]
    );

    const lastLogResult = await pool.query(
        `SELECT sync_status, sync_start_time, sync_end_time, error_message
         FROM device_sync_log
         WHERE device_id = $1
         ORDER BY sync_start_time DESC
         LIMIT 1`,
        [deviceId]
    );

    const device = deviceResult.rows[0];
    const lastLog = lastLogResult.rows[0];

    return {
        deviceStatus: device?.device_status ?? "UNKNOWN",
        networkStatus: device?.network_status ?? "UNKNOWN",
        syncStatus: lastLog?.sync_status ?? "NEVER_SYNCED",
        lastSync: device?.last_sync ?? null,
        lastError: lastLog?.error_message ?? null
    };
};

export const retrySync = async (deviceId: string, roomId: string) => {
    const result = await incrementalSync(deviceId, roomId);
    return { retried: true, status: "SUCCESS", ...result };
};
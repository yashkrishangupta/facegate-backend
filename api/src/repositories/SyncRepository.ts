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
        `SELECT t.timetable_id, t.batch_id, b.batch_code, t.faculty_id,
                f.first_name || ' ' || f.last_name AS faculty_name,
                t.subject_id, sub.subject_code, sub.subject_name, t.room_id,
                t.day_of_week, t.lecture_number, t.start_time, t.end_time,
                t.attendance_window_minutes, t.effective_from, t.effective_to,
                t.updated_at
         FROM timetable t
         JOIN batch b ON b.batch_id = t.batch_id
         JOIN faculty f ON f.faculty_id = t.faculty_id
         JOIN subject sub ON sub.subject_id = t.subject_id
         WHERE t.room_id = $1 AND t.is_active = TRUE ${sinceClause}`,
        timetableParams
    );

    const studentSinceClause = since ? "AND s.updated_at > $2" : "";
    const studentParams = since ? [roomId, since] : [roomId];

    const students = await pool.query(
        `SELECT DISTINCT s.student_id, s.batch_id, b.batch_code, s.registration_number,
                s.roll_number, s.first_name, s.last_name, s.email, s.phone,
                s.gender, s.student_status, s.updated_at
         FROM student s
         JOIN batch b ON b.batch_id = s.batch_id
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

    // Face embeddings — students belonging to this room's batches, so a
    // student enrolled at any device is recognizable at every room's
    // device, not just the one that captured them (architecture doc's
    // original intent — this previously wasn't wired into the sync
    // payload at all).
    const embeddingSinceClause = since ? "AND fe.updated_at > $2" : "";
    const embeddingParams = since ? [roomId, since] : [roomId];

    const embeddings = await pool.query(
        `SELECT fe.student_id, fe.embedding_data, fe.embedding_version,
                fe.model_name, fe.confidence_threshold, fe.updated_at
         FROM face_embedding fe
         WHERE fe.is_active = TRUE AND fe.embedding_status = 'ACTIVE'
           AND fe.student_id IN (
               SELECT DISTINCT s.student_id FROM student s
               WHERE s.batch_id IN (
                   SELECT DISTINCT batch_id FROM timetable
                   WHERE room_id = $1 AND is_active = TRUE
               )
           )
           ${embeddingSinceClause}`,
        embeddingParams
    );

    // Attendance-down — a manual correction made on the website (PUT
    // /attendance/:id) previously never reached any device. Scoped to this
    // room's sessions; full sync caps the lookback window at 30 days so it
    // doesn't dump the entire attendance history on every fresh pairing.
    // Android side does most-recent-wins on `updated_at` against its local
    // copy — see plan.md §6.2 for the agreed merge rule.
    const attendanceSinceClause = since ? "AND a.updated_at > $2" : "AND a.updated_at > $2";
    const attendanceParams = since
        ? [roomId, since]
        : [roomId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()];

    const attendanceDown = await pool.query(
        `SELECT a.attendance_id, t.timetable_id, ases.session_date, a.student_id,
                a.attendance_status AS status, a.attendance_mode,
                a.attendance_time, a.updated_at
         FROM attendance a
         JOIN attendance_session ases ON ases.attendance_session_id = a.attendance_session_id
         JOIN timetable t ON t.timetable_id = ases.timetable_id
         WHERE t.room_id = $1 AND a.is_active = TRUE ${attendanceSinceClause}`,
        attendanceParams
    );

    return {
        timetable: timetable.rows,
        students: students.rows,
        holidays: holidays.rows,
        embeddings: embeddings.rows,
        attendanceUpdates: attendanceDown.rows
    };
};

export const fullSync = async (deviceId: string, roomId: string) => {

    const startedAt = new Date();

    try {
        const data = await pullForRoom(roomId);

        await logSync(deviceId, "FULL", startedAt, {
            downloaded: data.timetable.length + data.students.length + data.holidays.length
                + data.embeddings.length + data.attendanceUpdates.length,
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
            downloaded: data.timetable.length + data.students.length + data.holidays.length
                + data.embeddings.length + data.attendanceUpdates.length,
            uploaded: 0,
            failed: 0
        });

        return {
            updatedTimetable: data.timetable.length,
            updatedStudents: data.students.length,
            updatedHolidays: data.holidays.length,
            updatedEmbeddings: data.embeddings.length,
            updatedAttendance: data.attendanceUpdates.length,
            timetable: data.timetable,
            students: data.students,
            holidays: data.holidays,
            embeddings: data.embeddings,
            attendanceUpdates: data.attendanceUpdates,
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
 *
 * attendance.attendance_session_id has a hard foreign key to
 * attendance_session, and attendance_session enforces one row per
 * (timetable_id, session_date) — so the device's own locally-generated
 * session_id can't be trusted as-is (two devices, or the same device
 * offline across a restart, could each mint a different UUID for what is
 * actually the same class period). Each record instead carries
 * timetable_id + session_date; this function resolves — creating on first
 * use — the one real session row for that period and attaches attendance
 * to that canonical ID.
 */
export const uploadAttendance = async (deviceId: string, attendanceData: any) => {

    const startedAt = new Date();
    const records: any[] = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData?.records ?? [];

    let uploaded = 0;
    let failed = 0;

    // Cache resolved session IDs within this batch so records for the same
    // period don't repeat the lookup/insert round trip.
    const sessionCache = new Map<string, string>();

    const resolveSessionId = async (timetableId: string, sessionDate: string): Promise<string> => {
        const cacheKey = `${timetableId}:${sessionDate}`;
        const cached = sessionCache.get(cacheKey);
        if (cached) return cached;

        const inserted = await pool.query(
            `INSERT INTO attendance_session
                (attendance_session_id, timetable_id, session_date, start_time, end_time, session_status)
             SELECT gen_random_uuid(), t.timetable_id, $2, t.start_time, t.end_time, 'ACTIVE'
             FROM timetable t
             WHERE t.timetable_id = $1
             ON CONFLICT ON CONSTRAINT uq_session_per_day DO NOTHING
             RETURNING attendance_session_id`,
            [timetableId, sessionDate]
        );

        const sessionId = inserted.rows[0]?.attendance_session_id
            ?? (await pool.query(
                `SELECT attendance_session_id FROM attendance_session
                 WHERE timetable_id = $1 AND session_date = $2`,
                [timetableId, sessionDate]
            )).rows[0]?.attendance_session_id;

        if (!sessionId) {
            throw new Error(`No timetable row found for timetable_id ${timetableId}`);
        }

        sessionCache.set(cacheKey, sessionId);
        return sessionId;
    };

    for (const record of records) {
        try {
            const sessionId = await resolveSessionId(record.timetable_id, record.session_date);

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
                    sessionId,
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

/**
 * Device push — a device that just captured a new embedding (on-device
 * enrollment, Flow B from the architecture doc, or a re-capture) uploads it
 * here. Upserts on student_id (uq_student_embedding) so a re-enrollment
 * naturally replaces the old vector rather than erroring or duplicating.
 */
export const uploadEmbedding = async (deviceId: string, embeddingData: any) => {
    const { student_id, embedding_data, embedding_version, model_name, confidence_threshold } = embeddingData;

    const startedAt = new Date();

    try {
        await pool.query(
            `INSERT INTO face_embedding
                (student_id, embedding_data, embedding_version, model_name, confidence_threshold)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT ON CONSTRAINT uq_student_embedding
             DO UPDATE SET
                embedding_data = EXCLUDED.embedding_data,
                embedding_version = EXCLUDED.embedding_version,
                model_name = EXCLUDED.model_name,
                confidence_threshold = EXCLUDED.confidence_threshold,
                embedding_status = 'ACTIVE',
                last_updated = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP`,
            [
                student_id,
                JSON.stringify(embedding_data),
                embedding_version || "v1.0",
                model_name,
                confidence_threshold ?? 75.00
            ]
        );

        await logSync(deviceId, "FACE_SYNC", startedAt, { downloaded: 0, uploaded: 1, failed: 0 });
        return { success: true };

    } catch (err: any) {
        await logSync(deviceId, "FACE_SYNC", startedAt, { downloaded: 0, uploaded: 0, failed: 1, error: err.message });
        throw err;
    }
};

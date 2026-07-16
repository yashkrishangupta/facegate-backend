import pool from "../config/database";
import * as ConflictRepository from "./ConflictRepository";

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

    // Conflicts-down — mirrors a website-side resolution (or a conflict an
    // admin raised manually) back to every device in the room, not just
    // the device that originally detected it. Previously this room's
    // conflict rows never left the website at all: the Android client has
    // always merged `data.conflicts` from this response (see
    // AttendanceSyncWorker), but the backend never populated the field, so
    // it silently stayed an empty list on every device forever.
    //
    // Routed by room two ways since attendance_session_id can be NULL
    // (session-less conflicts — see uploadConflicts): via the session's
    // timetable when there is one, falling back to the reporting device's
    // own room when there isn't.
    const conflictSinceClause = since ? "AND c.updated_at > $2" : "";
    const conflictParams = since ? [roomId, since] : [roomId];

    const conflicts = await pool.query(
        `SELECT c.conflict_id, c.attendance_id, c.attendance_session_id,
                c.student_id, c.device_id, c.conflict_type, c.severity,
                c.conflict_status, c.description, c.updated_at
         FROM conflict c
         LEFT JOIN attendance_session ases ON ases.attendance_session_id = c.attendance_session_id
         LEFT JOIN timetable t ON t.timetable_id = ases.timetable_id
         LEFT JOIN device d ON d.device_id = c.device_id
         WHERE (t.room_id = $1 OR d.room_id = $1) AND c.is_active = TRUE ${conflictSinceClause}`,
        conflictParams
    );

    return {
        timetable: timetable.rows,
        students: students.rows,
        holidays: holidays.rows,
        embeddings: embeddings.rows,
        conflicts: conflicts.rows,
        attendanceUpdates: attendanceDown.rows
    };
};

export const fullSync = async (deviceId: string, roomId: string) => {

    const startedAt = new Date();

    try {
        const data = await pullForRoom(roomId);

        await logSync(deviceId, "FULL", startedAt, {
            downloaded: data.timetable.length + data.students.length + data.holidays.length
                + data.embeddings.length + data.conflicts.length + data.attendanceUpdates.length,
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
                + data.embeddings.length + data.conflicts.length + data.attendanceUpdates.length,
            uploaded: 0,
            failed: 0
        });

        return {
            updatedTimetable: data.timetable.length,
            updatedStudents: data.students.length,
            updatedHolidays: data.holidays.length,
            updatedEmbeddings: data.embeddings.length,
            updatedConflicts: data.conflicts.length,
            updatedAttendance: data.attendanceUpdates.length,
            timetable: data.timetable,
            students: data.students,
            holidays: data.holidays,
            embeddings: data.embeddings,
            conflicts: data.conflicts,
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
/**
 * Resolves — creating on first use — the one real attendance_session row
 * for a (timetable_id, session_date) pair. Shared by both attendance
 * upload and conflict upload, since a conflict is always anchored to a
 * specific class period the same way an attendance record is, and a
 * device-generated local id can't be trusted as the canonical session id
 * (see uploadAttendance's doc comment for the full reasoning).
 */
const resolveSessionId = async (timetableId: string, sessionDate: string): Promise<string> => {
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

    return sessionId;
};

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

    const resolveCached = async (timetableId: string, sessionDate: string): Promise<string> => {
        const cacheKey = `${timetableId}:${sessionDate}`;
        const cached = sessionCache.get(cacheKey);
        if (cached) return cached;
        const sessionId = await resolveSessionId(timetableId, sessionDate);
        sessionCache.set(cacheKey, sessionId);
        return sessionId;
    };

    for (const record of records) {
        try {
            const sessionId = await resolveCached(record.timetable_id, record.session_date);

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

/**
 * Device-initiated student enrollment (StudentsFragment/EnrollmentViewModel
 * on Android) — creates the student row AND its face embedding in one
 * atomic call, mirroring FacultyRepository.createFacultyWithAccount's
 * transaction pattern. student_id is generated client-side (UUID) so the
 * local Room row and the server row share the same id from the start; the
 * insert is upserted on that id (rather than erroring) so a retried
 * request after a dropped connection doesn't fail or duplicate.
 *
 * batch_code (not batch_id) is what the device actually has on hand, since
 * batch_id is an internal server id the device never needs to know for
 * anything else — resolved to batch_id here.
 */
export const enrollStudent = async (deviceId: string, enrollData: any) => {

    const {
        student_id, batch_code, registration_number, roll_number,
        first_name, last_name, gender, admission_year, date_of_birth,
        profile_photo_url, email, phone, embedding_data, embedding_version, model_name
    } = enrollData;

    if (!student_id || !batch_code || !registration_number || !roll_number
        || !first_name || !last_name || !gender || !admission_year
        || !embedding_data || !model_name) {
        throw new Error(
            "student_id, batch_code, registration_number, roll_number, first_name, "
            + "last_name, gender, admission_year, embedding_data, and model_name are required"
        );
    }

    const startedAt = new Date();
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Device-captured batch_code can arrive with different casing or
        // stray whitespace than what's stored (it's often a free-text
        // "class" label picked on-device, not guaranteed to be an exact
        // copy of batch.batch_code) — match case/whitespace-insensitively
        // rather than failing every retry on a cosmetic mismatch.
        const batchResult = await client.query(
            `SELECT batch_id FROM batch
             WHERE UPPER(TRIM(batch_code)) = UPPER(TRIM($1)) AND is_active = TRUE`,
            [batch_code]
        );
        const batchId = batchResult.rows[0]?.batch_id;
        if (!batchId) {
            throw new Error(`No active batch found for batch_code "${batch_code}"`);
        }

        // A student with this (batch, roll_number) or registration_number
        // may already exist — most commonly because the roster was entered
        // on the website first (name/roll/registration, no photo capture
        // there) and the device is only now attaching the face embedding.
        // The device always proposes a fresh student_id for a "new"
        // enrollment (it can't know the website's UUID for that row), so
        // matching purely on student_id would treat this as a brand-new
        // insert and collide with uq_student_batch_roll / the registration
        // number's UNIQUE constraint — a permanent, unrecoverable 400 for
        // any student the office already rostered. Resolve to the existing
        // row when there is one instead of only ever trying to create.
        const existing = await client.query(
            `SELECT student_id FROM student
             WHERE (batch_id = $1 AND roll_number = $2) OR registration_number = $3
             LIMIT 1`,
            [batchId, roll_number, registration_number]
        );
        const resolvedStudentId = existing.rows[0]?.student_id ?? student_id;

        const studentResult = await client.query(
            `INSERT INTO student
                (student_id, batch_id, registration_number, roll_number, first_name,
                 last_name, email, phone, gender, date_of_birth, admission_year, profile_photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (student_id) DO UPDATE SET
                batch_id = EXCLUDED.batch_id,
                registration_number = EXCLUDED.registration_number,
                roll_number = EXCLUDED.roll_number,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                gender = EXCLUDED.gender,
                date_of_birth = EXCLUDED.date_of_birth,
                admission_year = EXCLUDED.admission_year,
                -- Only overwrite an existing photo when this enrollment
                -- actually supplies one — otherwise a re-enrollment (embedding
                -- refresh only) would null out a photo set earlier on the
                -- website.
                profile_photo_url = COALESCE(EXCLUDED.profile_photo_url, student.profile_photo_url),
                updated_at = CURRENT_TIMESTAMP
             RETURNING student_id`,
            [
                resolvedStudentId, batchId, registration_number, roll_number, first_name,
                last_name, email ?? null, phone ?? null, gender, date_of_birth ?? null,
                admission_year, profile_photo_url ?? null
            ]
        );

        const embeddingResult = await client.query(
            `INSERT INTO face_embedding
                (student_id, embedding_data, embedding_version, model_name, confidence_threshold)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT ON CONSTRAINT uq_student_embedding
             DO UPDATE SET
                embedding_data = EXCLUDED.embedding_data,
                embedding_version = EXCLUDED.embedding_version,
                model_name = EXCLUDED.model_name,
                embedding_status = 'ACTIVE',
                last_updated = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
             RETURNING embedding_id`,
            [resolvedStudentId, JSON.stringify(embedding_data), embedding_version || "v1.0", model_name, 75.00]
        );

        await client.query("COMMIT");

        await logSync(deviceId, "STUDENT_ENROLLMENT", startedAt, { downloaded: 0, uploaded: 1, failed: 0 });

        return {
            student_id: studentResult.rows[0].student_id,
            embedding_id: embeddingResult.rows[0].embedding_id
        };

    } catch (err: any) {
        await client.query("ROLLBACK");
        await logSync(deviceId, "STUDENT_ENROLLMENT", startedAt, { downloaded: 0, uploaded: 0, failed: 1, error: err.message });
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Device push — conflicts the decision engine detected locally (low
 * confidence match, duplicate attendance, unknown face, etc.), batched
 * like attendance upload. Each record resolves its own attendance_session
 * from timetable_id + session_date when both are present; a record with
 * neither (e.g. SYNC_FAILURE/DEVICE_ERROR outside any scheduled period) is
 * still created with a NULL session — device_id alone still attributes it
 * to a room/device. client_refs lets the device correlate created rows
 * back to its local ids.
 */
export const uploadConflicts = async (deviceId: string, conflictData: any) => {

    const startedAt = new Date();
    const records: any[] = Array.isArray(conflictData) ? conflictData : conflictData?.records ?? [];
    const clientRefs: any[] = conflictData?.client_refs ?? [];

    const created: { client_ref: number; conflict_id: string }[] = [];
    let uploaded = 0;
    let failed = 0;

    const sessionCache = new Map<string, string>();
    const resolveCached = async (timetableId: string, sessionDate: string): Promise<string> => {
        const cacheKey = `${timetableId}:${sessionDate}`;
        const cached = sessionCache.get(cacheKey);
        if (cached) return cached;
        const sessionId = await resolveSessionId(timetableId, sessionDate);
        sessionCache.set(cacheKey, sessionId);
        return sessionId;
    };

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const clientRef = clientRefs[i] ?? i;
        try {
            // A session is resolved when possible (anchors the conflict to
            // a specific class period, and is what lets the conflicts-down
            // sync route it back to every device in that room). When
            // there's no timetable_id/session_date — SYNC_FAILURE,
            // DEVICE_ERROR, or an UNKNOWN_FACE hit outside any scheduled
            // period — the conflict is still created with a NULL session;
            // device_id (always set here) still attributes it to a
            // room/device.
            const sessionId = (record.timetable_id && record.session_date)
                ? await resolveCached(record.timetable_id, record.session_date)
                : null;

            const result = await pool.query(
                `INSERT INTO conflict
                    (attendance_session_id, student_id, device_id, conflict_type, severity, description)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING conflict_id`,
                [
                    sessionId,
                    record.student_id ?? null,
                    deviceId,
                    record.conflict_type,
                    record.severity ?? "MEDIUM",
                    record.description ?? null
                ]
            );

            created.push({ client_ref: clientRef, conflict_id: result.rows[0].conflict_id });
            uploaded++;
        } catch (err) {
            console.error("Conflict upload row failed:", err);
            failed++;
        }
    }

    await logSync(deviceId, "CONFLICT_UPLOAD", startedAt, { downloaded: 0, uploaded, failed });

    return { created };
};

/**
 * Device resolving a conflict it's showing to whoever's standing at the
 * tablet — mirrors the website's PUT /conflicts/:id/resolve and
 * /conflicts/:id/status, but device-authed and restricted to RESOLVED /
 * REJECTED (a device doesn't have a UNDER_REVIEW workflow, and resolved_by
 * is an admin_user FK — a device has no admin_id, so it's always left
 * null; the device's own identity is recorded in resolution_notes
 * instead).
 */
export const resolveConflictAsDevice = async (deviceId: string, conflictId: string, status: string) => {
    const valid = ["RESOLVED", "REJECTED"];
    if (!valid.includes(status)) {
        throw new Error(`conflict_status must be one of: ${valid.join(", ")}`);
    }

    const startedAt = new Date();
    try {
        const conflict = await ConflictRepository.updateConflictStatus(
            conflictId, status, null, `Resolved from device ${deviceId}`
        );
        if (!conflict) throw new Error("Conflict not found");

        await logSync(deviceId, "CONFLICT_RESOLVE", startedAt, { downloaded: 0, uploaded: 1, failed: 0 });
        return conflict;
    } catch (err: any) {
        await logSync(deviceId, "CONFLICT_RESOLVE", startedAt, { downloaded: 0, uploaded: 0, failed: 1, error: err.message });
        throw err;
    }
};

/**
 * Read-only, room-scoped report summaries (ReportsSyncResponse on
 * Android) — one row per session taught in this device's room, computed
 * live from attendance the same way ReportRepository does for the website,
 * rather than trusting attendance_session's total_students/present_students/
 * absent_students columns (nothing in this codebase keeps those updated).
 * `since` is optional; defaults to a 7-day lookback so a fresh device
 * doesn't pull the room's entire report history.
 */
export const getReports = async (deviceId: string, roomId: string, since?: string) => {
    const sinceClause = since ? "AND ases.updated_at > $2" : "AND ases.updated_at > $2";
    const params = since
        ? [roomId, since]
        : [roomId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()];

    const startedAt = new Date();
    const result = await pool.query(
        `SELECT
            t.timetable_id,
            ases.session_date,
            sub.subject_name,
            b.batch_code,
            COUNT(DISTINCT s.student_id) AS total_students,
            COUNT(DISTINCT a.student_id) FILTER (WHERE a.attendance_status = 'PRESENT' AND a.is_active = TRUE) AS present_students,
            COUNT(DISTINCT s.student_id) - COUNT(DISTINCT a.student_id) FILTER (WHERE a.attendance_status = 'PRESENT' AND a.is_active = TRUE) AS absent_students,
            ases.updated_at
         FROM attendance_session ases
         JOIN timetable t ON t.timetable_id = ases.timetable_id
         JOIN subject sub ON sub.subject_id = t.subject_id
         JOIN batch b ON b.batch_id = t.batch_id
         JOIN student s ON s.batch_id = b.batch_id AND s.is_active = TRUE
         LEFT JOIN attendance a ON a.attendance_session_id = ases.attendance_session_id
         WHERE t.room_id = $1 AND ases.is_active = TRUE ${sinceClause}
         GROUP BY t.timetable_id, ases.session_date, sub.subject_name, b.batch_code, ases.updated_at
         ORDER BY ases.session_date DESC`,
        params
    );

    await logSync(deviceId, "REPORTS_PULL", startedAt, { downloaded: result.rows.length, uploaded: 0, failed: 0 });

    return result.rows.map(row => ({
        ...row,
        total_students: Number(row.total_students),
        present_students: Number(row.present_students),
        absent_students: Number(row.absent_students)
    }));
};
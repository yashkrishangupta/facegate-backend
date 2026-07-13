# FaceGate Database Reference

PostgreSQL, 19 tables. Source of truth is `facegate-backend/api/src/db/schema.sql`; if this document and that file disagree, `schema.sql` wins. Written for anyone fixing the Android app, so tables it actually touches
(`device`, `timetable`, `student`, `holiday`, `attendance`, `attendance_session`, `face_embedding`) are called out explicitly.

All tables use `gen_random_uuid()` primary keys, and almost all have `is_active BOOLEAN`
(soft delete), `created_at`, `updated_at`. Only deviations from that pattern are noted.

---

## Entity groups

```
department ─┬─ batch ──┬─ student
            ├─ faculty ─┬─ admin_user (FACULTY role accounts)
            └─ subject  │
                        │
program ─────┬─ batch.program_id
             └─ subject.program_id
                        │
room ───────────────────┼─── device
                        │
academic_calendar ──── holiday
                        │
batch + faculty + subject + room ─── timetable ─── attendance_session ─── attendance
                                                                              │
                                                                        face_embedding
                                                                        conflict
                                                                        device_sync_log

admin_user ─── change_log
admin_user ─── notification
```

---

## Master data

### `department`
| Column | Type | Notes |
|---|---|---|
| department_id | UUID PK | |
| department_code | VARCHAR(10) | UNIQUE |
| department_name | VARCHAR(100) | UNIQUE |
| hod_name | VARCHAR(100) | nullable |
| email | VARCHAR(100) | nullable — CHECK: `NULL` or valid regex (empty string fails this; app code converts `''` → `NULL`) |
| phone | VARCHAR(15) | nullable |

### `program` — **new table**, previously a hardcoded 5-value string duplicated on `batch` and `subject`
| Column | Type | Notes |
|---|---|---|
| program_id | UUID PK | |
| program_code | VARCHAR(20) | UNIQUE |
| program_name | VARCHAR(100) | e.g. "B.Tech Computer Science" |
| degree_type | VARCHAR(20) | CHECK: `UG`, `PG`, `Doctoral` |
| duration_years | INTEGER | CHECK `> 0` |

`batch.program_id` and `subject.program_id` both FK here now — there is no free-text
`program` column left on either table.

### `batch`
| Column | Type | Notes |
|---|---|---|
| batch_id | UUID PK | |
| department_id | UUID FK → department | |
| batch_code | VARCHAR(20) | UNIQUE |
| program_id | UUID FK → program | |
| academic_year | VARCHAR(9) | e.g. `2026-27` |
| semester | INT | CHECK 1–8 |
| section | VARCHAR(5) | **NOT NULL, no default — genuinely required**, not optional despite reading like it might be |
| strength | INT | **NOT NULL, no default — genuinely required** |
| batch_advisor_id | UUID FK → faculty | nullable |

### `faculty`
| Column | Type | Notes |
|---|---|---|
| faculty_id | UUID PK | |
| department_id | UUID FK → department | |
| employee_id | VARCHAR(20) | UNIQUE |
| first_name, last_name | VARCHAR(50) | |
| email | VARCHAR(100) | UNIQUE, NOT NULL, regex-checked |
| phone | VARCHAR(15) | nullable |
| designation | VARCHAR(50) | |
| specialization | VARCHAR(100) | nullable |
| joining_date | DATE | nullable |
| office_location | VARCHAR(100) | nullable |

Creating a faculty row also auto-creates its `admin_user` login in the same transaction
(`FacultyRepository.createFacultyWithAccount`).

### `subject`
| Column | Type | Notes |
|---|---|---|
| subject_id | UUID PK | |
| department_id | UUID FK → department | |
| subject_code | VARCHAR(20) | UNIQUE |
| subject_name | VARCHAR(100) | |
| program_id | UUID FK → program | |
| semester | INT | CHECK 1–8 |
| credits | INT | CHECK `> 0` |
| subject_type | VARCHAR(20) | CHECK: `Theory`, `Lab`, `Tutorial` |
| course_category | VARCHAR(20) | CHECK: `Core`, `Elective`, `Open Elective`; defaults `Core` |
| contact_hours_per_week | INT | CHECK `> 0` |
| description | TEXT | nullable |

### `room` — **Android-relevant** (every device belongs to exactly one)
| Column | Type | Notes |
|---|---|---|
| room_id | UUID PK | |
| room_number | VARCHAR(20) | UNIQUE, e.g. `Room-101` |
| room_name | VARCHAR(100) | nullable |
| building_name | VARCHAR(100) | |
| floor_number | INT | nullable |
| room_type | VARCHAR(30) | CHECK: `Lecture Hall`, `Laboratory`, `Seminar Hall`, `Tutorial Room`, `Conference Room` |
| capacity | INT | |
| has_projector, has_wifi | BOOLEAN | |
| remarks | TEXT | nullable |

### `academic_calendar`
| Column | Type | Notes |
|---|---|---|
| calendar_id | UUID PK | |
| calendar_date | DATE | |
| academic_year | VARCHAR | |
| semester | INT | |
| is_working_day | BOOLEAN | |
| event_type | VARCHAR(20) | CHECK: `WORKING_DAY`, `HOLIDAY`, `EXAM`, `VACATION`, `EVENT` |
| event_name | VARCHAR(100) | nullable |

---

## People

### `student` — **Android-relevant** (syncs down, matched against face embeddings)
| Column | Type | Notes |
|---|---|---|
| student_id | UUID PK | |
| batch_id | UUID FK → batch | |
| registration_number | VARCHAR(30) | UNIQUE |
| roll_number | VARCHAR(20) | |
| first_name, last_name | VARCHAR(50) | |
| email | VARCHAR(100) | nullable, regex CHECK when present (empty string converted to NULL server-side) |
| phone | VARCHAR(15) | nullable |
| gender | VARCHAR(10) | CHECK: `Male`, `Female`, `Other` |
| date_of_birth | DATE | nullable |
| admission_year | INT | CHECK `>= 2000` |
| profile_photo_url | TEXT | nullable |
| student_status | VARCHAR(20) | CHECK: `ACTIVE`, `GRADUATED`, `SUSPENDED`, `DROPPED` |

`GET /students` derives (never stores) an `enrollment_status` via `LEFT JOIN face_embedding`
— `'ENROLLED'` if an `ACTIVE` embedding exists, else `'NOT_ENROLLED'`. `embedding_data`
itself is never selected in that query.

A device only ever receives students whose `batch_id` has at least one `timetable` row in
that device's room.

### `admin_user` — website/faculty logins, **not used by Android**
| Column | Type | Notes |
|---|---|---|
| admin_id | UUID PK | |
| employee_id | VARCHAR(20) | UNIQUE |
| username | VARCHAR(50) | UNIQUE, nullable — login key. Auto-generated for faculty (`firstname.lastname`, deduped with a trailing number); same generator now also backs direct `POST /admin` account creation |
| faculty_id | UUID FK → faculty | UNIQUE, nullable — only set for `role = 'FACULTY'` rows |
| first_name, last_name | VARCHAR(50) | |
| email | VARCHAR(100) | UNIQUE, NOT NULL, regex-checked |
| password_hash | TEXT | bcrypt |
| role | VARCHAR(20) | CHECK: `SUPER_ADMIN`, `ADMIN`, `FACULTY`, `VIEWER` |
| phone | VARCHAR(15) | nullable |
| last_login | TIMESTAMP | nullable |
| account_status | VARCHAR(20) | `ACTIVE` / `DISABLED` |
| failed_login_attempts | INT | reset on successful login or an `ACTIVE` status reset |

Two ways a row gets created: `POST /faculty` (always `role='FACULTY'`, atomic with the
`faculty` row) or `POST /admin` (`SUPER_ADMIN` only, direct — `ADMIN`/`SUPER_ADMIN`/`VIEWER`,
never `FACULTY`, since that would leave an orphaned login with no teaching record).

---

## Scheduling

### `timetable` — **Android-relevant** (syncs down, filtered by `room_id`)
| Column | Type | Notes |
|---|---|---|
| timetable_id | UUID PK | |
| batch_id | UUID FK → batch | |
| faculty_id | UUID FK → faculty | |
| subject_id | UUID FK → subject | |
| room_id | UUID FK → room | **the sync filter key** |
| day_of_week | VARCHAR(10) | Monday–Saturday (no Sunday value) |
| lecture_number | INT | |
| start_time, end_time | TIME | |
| attendance_window_minutes | INT | |
| effective_from | DATE | **NOT NULL, no default** — the create API defaults it to today if the caller omits it, but the column itself has no DB-level default |
| effective_to | DATE | nullable |
| updated_at | TIMESTAMP | used for delta sync |

UNIQUE on `(batch_id, day_of_week, lecture_number)`. The application layer (not the DB)
additionally rejects a create where a *different* batch already has an overlapping room or
faculty booking at the same day/time — checked on create only, not on update.

### `attendance_session` — created lazily, not synced down directly
| Column | Type | Notes |
|---|---|---|
| attendance_session_id | UUID PK | |
| timetable_id | UUID FK → timetable | |
| session_date | DATE | |
| start_time, end_time | TIME | |
| session_status | VARCHAR(20) | `SCHEDULED` / `ACTIVE` / `COMPLETED` / `CANCELLED` |
| attendance_mode | VARCHAR(20) | CHECK: `FACE_RECOGNITION`, `MANUAL`, `HYBRID`; default `FACE_RECOGNITION` |
| total_students, present_students, absent_students | INT | denormalized counts |

UNIQUE `uq_session_per_day` on `(timetable_id, session_date)` — the constraint both the
device sync path (`POST /sync/attendance`) and the website's manual-marking path
(`POST /attendance/manual`) rely on to safely create-or-reuse the one real session row for a
given period/date, rather than trusting a client-invented session ID.

### `holiday` — **Android-relevant** (syncs down, global — not room-filtered)
| Column | Type | Notes |
|---|---|---|
| holiday_id | UUID PK | |
| calendar_id | UUID FK → academic_calendar | |
| holiday_name | VARCHAR(100) | |
| holiday_type | VARCHAR(30) | CHECK: `NATIONAL`, `INSTITUTIONAL`, `FESTIVAL`, `EMERGENCY`, `GAZETTED` |
| is_recurring | BOOLEAN | |
| created_by | UUID FK → admin_user | nullable |

The `POST /holidays` request body sends a flat `holiday_date`/`academic_year`/`semester`
even though this table has no date column itself — `HolidayRepository` transparently
upserts the matching `academic_calendar` row first.

---

## Devices & attendance

### `device` — **Android-relevant**, the core identity table
| Column | Type | Notes |
|---|---|---|
| device_id | UUID PK | permanent identity, returned once at pairing |
| room_id | UUID FK → room | |
| device_identifier | VARCHAR(100) | UNIQUE, nullable — set at pairing, audit-only |
| device_name | VARCHAR(100) | set by admin at creation |
| device_type | VARCHAR(30) | CHECK: `ANDROID_TABLET`, `ANDROID_PHONE` |
| app_version | VARCHAR(20) | nullable until paired |
| operating_system | VARCHAR(50) | nullable until paired |
| device_token | UUID | UNIQUE, nullable — **the actual credential**, set once at pairing |
| pairing_code | VARCHAR(6) | UNIQUE, nullable — cleared on redemption |
| pairing_code_expires_at | TIMESTAMP | nullable — 15 minutes from creation |
| last_heartbeat, last_sync | TIMESTAMP | nullable |
| battery_percentage, storage_available_mb | INT | nullable, via heartbeat |
| network_status | VARCHAR(20) | `ONLINE` / `OFFLINE` |
| device_status | VARCHAR(20) | CHECK: `PENDING_PAIRING`, `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `LOST` |

**Partial unique index** `uq_device_one_active_per_room` on `room_id` `WHERE device_status =
'ACTIVE' AND is_active = TRUE`. `GET /:deviceId/health` and `GET /:deviceId/sync-history`
read this table plus `device_sync_log` — no schema changes needed for those, the data was
already there.

### `attendance` — **Android-relevant**, what the device pushes up (and now also pulls down)
| Column | Type | Notes |
|---|---|---|
| attendance_id | UUID PK | not stable across a retry — upsert key is `(attendance_session_id, student_id)` |
| attendance_session_id | UUID FK → attendance_session | |
| student_id | UUID FK → student | |
| device_id | UUID FK → device | nullable — NULL for website-authored manual marks |
| attendance_status | VARCHAR(20) | CHECK: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` |
| attendance_mode | VARCHAR(20) | e.g. `FACE_RECOGNITION`, `MANUAL` |
| recognition_confidence | NUMERIC | nullable |
| attendance_time | TIMESTAMP | |
| synced | BOOLEAN | true once the server has 200'd the row |
| updated_at | TIMESTAMP | bumped on every write, including manual corrections — **this is what the new attendance-down sync compares for most-recent-wins** |

UNIQUE `uq_student_session` on `(attendance_session_id, student_id)`.

### `face_embedding` — **Android-relevant, now syncs both directions**
| Column | Type | Notes |
|---|---|---|
| embedding_id | UUID PK | |
| student_id | UUID FK → student | **UNIQUE — one embedding per student** |
| embedding_version | INT/VARCHAR | |
| embedding_data | JSONB | the feature vector — **never selected in the Students-list join, only in the dedicated sync payload** |
| model_name | VARCHAR(50) | |
| confidence_threshold | NUMERIC | |
| embedding_status | VARCHAR(20) | CHECK: `ACTIVE`, `INACTIVE`, `REVOKED` |

Down: included in `POST /sync/full` and `GET /sync/incremental` for students in the
device's room. Up: `POST /sync/embeddings`, upserts on `student_id`.

### `device_sync_log`
| Column | Type | Notes |
|---|---|---|
| sync_log_id | UUID PK | |
| device_id | UUID FK → device | |
| sync_type | VARCHAR(20) | CHECK: `FULL`, `INCREMENTAL`, `ATTENDANCE_UPLOAD`, `HEARTBEAT`, `HOLIDAY_SYNC`, `TIMETABLE_SYNC`, `STUDENT_SYNC`, `FACE_SYNC` |
| sync_status | VARCHAR(20) | CHECK: `SUCCESS`, `FAILED`, `PARTIAL`, `IN_PROGRESS` |
| sync_start_time, sync_end_time | TIMESTAMP | |
| records_uploaded, records_downloaded, failed_records | INT | |
| error_message | TEXT | nullable |

Written automatically by every sync/pair/embedding-upload call. `GET /devices/:id/health`
and `GET /devices/:id/sync-history` read this table back.

---

## Admin / ops

### `notification`
admin_id (FK→admin_user, nullable), title, message, notification_type (CHECK: `SYSTEM`,
`ATTENDANCE`, `DEVICE`, `CONFLICT`, `SYNC`, `HOLIDAY`, `TIMETABLE`, `SECURITY`,
`ANNOUNCEMENT`), priority (CHECK: `LOW`/`MEDIUM`/`HIGH`/`CRITICAL`), is_read.

### `conflict`
attendance_id/attendance_session_id/student_id/device_id (FKs), conflict_type (CHECK:
`LOW_CONFIDENCE`, `DUPLICATE_ATTENDANCE`, `SYNC_FAILURE`, `MANUAL_REVIEW`, `DEVICE_ERROR`,
`UNKNOWN_FACE`), severity (`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`), conflict_status (`PENDING`/
`UNDER_REVIEW`/`RESOLVED`/`REJECTED` — all four now reachable via `PUT /:id/resolve` and
`PUT /:id/status`), resolution_notes, resolved_by (FK→admin_user), resolved_at.

### `change_log`
admin_id (FK→admin_user, nullable), entity_name, entity_id, action (CHECK: `CREATE`,
`UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `SYNC`, `RESOLVE`, `EXPORT` — only the first four plus
`LOGIN` are actually written anywhere currently), old_values/new_values (JSONB, passwords
never included). Written via a shared `recordChange()` helper called from Room/Device/
Faculty/Admin/Batch create-update-deactivate flows and login events.

---

## What Android's local Room database should mirror

Based on what actually syncs, the local schema should shadow: `room` (this device's own row),
`timetable` (filtered to this room), `student` (filtered to batches taught in this room,
including `enrollment_status`), `holiday` (all of them), `face_embedding` (**new** — students
in this room's batches, for cross-device recognition), and its own `attendance` rows pending
upload (`synced: Boolean`, matching the server column semantics exactly).

**New requirement, not yet implemented on the Android side:** a way to reconcile
`attendanceUpdates` (server-authored corrections) against local rows using most-recent-wins
on `updated_at` — see `api.md` and `API_CONTRACT.md` for the exact merge rule. This needs an
`updated_at` (or equivalent) field tracked locally per attendance row if it isn't already.
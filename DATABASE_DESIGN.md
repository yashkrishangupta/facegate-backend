# FaceGate Database Reference

PostgreSQL. Source of truth is `facegate-backend/api/src/db/schema.sql` — this document
describes it in prose; if the two disagree, `schema.sql` wins. Written for anyone fixing the
Android app, so tables the app actually touches (`device`, `timetable`, `student`,
`holiday`, `attendance`, `attendance_session`) are called out explicitly wherever they
matter.

All tables use `gen_random_uuid()` primary keys, and almost all have `is_active BOOLEAN`
(soft delete), `created_at`, `updated_at`. Only deviations from that pattern are noted.

---

## Entity groups

```
department ─┬─ batch ─┬─ student
            ├─ faculty ─┬─ admin_user (FACULTY role accounts)
            └─ subject  │
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
| department_name | VARCHAR(100) | |
| hod_name | VARCHAR(100) | nullable |
| email | VARCHAR(100) | nullable |
| phone | VARCHAR(15) | nullable |

### `batch`
| Column | Type | Notes |
|---|---|---|
| batch_id | UUID PK | |
| department_id | UUID FK → department | |
| batch_code | VARCHAR(30) | UNIQUE |
| program | VARCHAR(20) | CHECK: `B.Tech`, `M.Tech`, `PhD`, `MBA`, `MCA` |
| academic_year | VARCHAR(10) | e.g. `2026-27` |
| semester | INT | CHECK 1–8 |
| section | VARCHAR(5) | nullable |
| strength | INT | expected headcount |
| batch_advisor_id | UUID FK → faculty | nullable |

### `faculty`
| Column | Type | Notes |
|---|---|---|
| faculty_id | UUID PK | |
| department_id | UUID FK → department | |
| employee_id | VARCHAR(20) | UNIQUE |
| first_name, last_name | VARCHAR(50) | |
| email | VARCHAR(100) | UNIQUE, NOT NULL |
| phone | VARCHAR(15) | nullable |
| designation | VARCHAR(50) | e.g. Professor, Assistant Professor |
| specialization | VARCHAR(200) | nullable |
| joining_date | DATE | nullable |
| office_location | VARCHAR(100) | nullable |

Creating a faculty row also auto-creates its `admin_user` login (see below) — not a DB-level
trigger, done in application code (`FacultyRepository.createFacultyWithAccount`, one
transaction).

### `subject`
| Column | Type | Notes |
|---|---|---|
| subject_id | UUID PK | |
| department_id | UUID FK → department | |
| subject_code | VARCHAR(20) | UNIQUE |
| subject_name | VARCHAR(100) | |
| program | VARCHAR(20) | same CHECK list as batch.program |
| semester | INT | CHECK 1–8 |
| credits | INT | |
| subject_type | VARCHAR(20) | CHECK: `Theory`, `Lab`, `Tutorial` |
| course_category | VARCHAR(20) | CHECK: `Core`, `Elective`, `Open Elective` |
| contact_hours_per_week | INT | |
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
| academic_year | VARCHAR(10) | |
| semester | INT | |
| is_working_day | BOOLEAN | |
| event_type | VARCHAR(20) | CHECK: `WORKING_DAY`, `HOLIDAY`, `EXAM`, `VACATION`, `EVENT` |
| event_name | VARCHAR(100) | nullable |
| description | TEXT | nullable |

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
| email | VARCHAR(100) | nullable |
| phone | VARCHAR(15) | nullable |
| gender | VARCHAR(10) | nullable |
| date_of_birth | DATE | nullable |
| admission_year | INT | nullable |
| profile_photo_url | TEXT | nullable |
| student_status | VARCHAR(20) | CHECK: `ACTIVE`, `GRADUATED`, `SUSPENDED`, `DROPPED` |

A device only ever receives students whose `batch_id` has at least one `timetable` row in
that device's room — see api.md's Sync section for the exact query.

### `admin_user` — website/faculty logins, **not used by Android**
| Column | Type | Notes |
|---|---|---|
| admin_id | UUID PK | |
| employee_id | VARCHAR(20) | UNIQUE |
| username | VARCHAR(50) | UNIQUE, nullable — login key. Auto-generated for faculty (`firstname.lastname`, deduped with a trailing number on collision) |
| faculty_id | UUID FK → faculty | UNIQUE, nullable — only set for `role = 'FACULTY'` rows |
| first_name, last_name | VARCHAR(50) | |
| email | VARCHAR(100) | UNIQUE, NOT NULL, regex-checked |
| password_hash | TEXT | bcrypt |
| role | VARCHAR(20) | CHECK: `SUPER_ADMIN`, `ADMIN`, `FACULTY`, `VIEWER` |
| phone | VARCHAR(15) | nullable |
| last_login | TIMESTAMP | nullable |
| account_status | VARCHAR(20) | `ACTIVE` / `DISABLED` (deactivating a faculty member sets this) |
| failed_login_attempts | INT | reset to 0 on successful login or on an `ACTIVE` status reset |

---

## Scheduling

### `timetable` — **Android-relevant** (syncs down, filtered by `room_id`)
| Column | Type | Notes |
|---|---|---|
| timetable_id | UUID PK | |
| batch_id | UUID FK → batch | |
| faculty_id | UUID FK → faculty | |
| subject_id | UUID FK → subject | |
| room_id | UUID FK → room | **this is the sync filter key** |
| day_of_week | VARCHAR(10) | Monday–Sunday |
| lecture_number | INT | |
| start_time, end_time | TIME | |
| attendance_window_minutes | INT | how long after start_time attendance can still be marked |
| effective_from, effective_to | DATE | nullable — for schedule changes mid-semester |
| updated_at | TIMESTAMP | used for delta sync (`?since=`) |

UNIQUE on `(batch_id, day_of_week, lecture_number)` — a batch can't have two lectures in the
same slot.

### `attendance_session` — created lazily, not synced down directly
| Column | Type | Notes |
|---|---|---|
| attendance_session_id | UUID PK | |
| timetable_id | UUID FK → timetable | |
| session_date | DATE | |
| start_time, end_time | TIME | |
| session_status | VARCHAR(20) | `SCHEDULED` / `ACTIVE` / `COMPLETED` / `CANCELLED` |
| attendance_window_start, attendance_window_end | TIMESTAMP | nullable |
| total_students, present_students, absent_students | INT | denormalized counts |
| attendance_mode | VARCHAR(20) | nullable |

UNIQUE constraint `uq_session_per_day` on `(timetable_id, session_date)` — **this is the
constraint the sync upload endpoint relies on** to safely create-or-reuse a session row when
a device pushes attendance (see api.md). The device never invents a session UUID for the
server to trust; it sends `timetable_id` + `session_date` and the server resolves the real
row.

### `holiday` — **Android-relevant** (syncs down, global — not room-filtered)
| Column | Type | Notes |
|---|---|---|
| holiday_id | UUID PK | |
| calendar_id | UUID FK → academic_calendar | |
| holiday_name | VARCHAR(100) | |
| holiday_type | VARCHAR(30) | nullable |
| is_recurring | BOOLEAN | |
| created_by | UUID FK → admin_user | nullable |

---

## Devices & attendance

### `device` — **Android-relevant**, the core identity table
| Column | Type | Notes |
|---|---|---|
| device_id | UUID PK | this device's permanent identity, returned once at pairing |
| room_id | UUID FK → room | |
| device_identifier | VARCHAR(100) | UNIQUE, nullable — `Manufacturer-Model-UUID`, set at pairing, audit-only, not used for auth |
| device_name | VARCHAR(100) | set by admin at creation |
| device_type | VARCHAR(30) | CHECK: `ANDROID_TABLET`, `ANDROID_PHONE` |
| app_version | VARCHAR(20) | nullable until paired |
| operating_system | VARCHAR(50) | nullable until paired |
| device_token | UUID | UNIQUE, nullable — **the actual credential**, only ever set once, at pairing. Sent as `x-api-key` on every protected device call |
| pairing_code | VARCHAR(6) | UNIQUE, nullable — cleared the moment it's redeemed |
| pairing_code_expires_at | TIMESTAMP | nullable — 15 minutes from creation |
| registration_date | TIMESTAMP | set (or reset) when pairing completes |
| last_heartbeat, last_sync | TIMESTAMP | nullable |
| battery_percentage, storage_available_mb | INT | nullable, sent via heartbeat |
| network_status | VARCHAR(20) | CHECK: `ONLINE` / `OFFLINE` (check the actual constraint in schema.sql for the full list) |
| device_status | VARCHAR(20) | CHECK: `PENDING_PAIRING`, `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `LOST` |

**Partial unique index** `uq_device_one_active_per_room` on `room_id` `WHERE device_status =
'ACTIVE' AND is_active = TRUE` — a room can have at most one ACTIVE device. Enforced at the
DB level as a backstop; the API also checks and returns a friendly 409/400 before ever
hitting this constraint.

### `attendance` — **Android-relevant**, what the device pushes up
| Column | Type | Notes |
|---|---|---|
| attendance_id | UUID PK | server-generated — **do not treat as stable across a retry**; upsert key is `(attendance_session_id, student_id)`, not this column |
| attendance_session_id | UUID FK → attendance_session | |
| student_id | UUID FK → student | |
| device_id | UUID FK → device | nullable |
| attendance_status | VARCHAR(20) | CHECK: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` |
| attendance_mode | VARCHAR(20) | e.g. `FACE_RECOGNITION`, `MANUAL` |
| recognition_confidence | NUMERIC | nullable |
| attendance_time | TIMESTAMP | when the mark actually happened, device-supplied |
| verification_status | VARCHAR(20) | nullable |
| synced | BOOLEAN | **the flag from the architecture doc** — true once the server has 200'd the row |
| synced_at | TIMESTAMP | nullable |
| updated_at | TIMESTAMP | bumped on every write, including website manual corrections |

UNIQUE `uq_student_session` on `(attendance_session_id, student_id)` — this is what makes the
batch upload endpoint's `ON CONFLICT ... DO UPDATE` upsert safe to retry.

### `face_embedding`
| Column | Type | Notes |
|---|---|---|
| embedding_id | UUID PK | |
| student_id | UUID FK → student | **UNIQUE — one embedding per student**, not one row per capture |
| embedding_version | INT | |
| embedding_data | JSONB | the actual feature vector |
| model_name | VARCHAR(50) | |
| confidence_threshold | NUMERIC | |
| embedding_status | VARCHAR(20) | CHECK: `ACTIVE`, `INACTIVE`, `REVOKED` |

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

Written automatically by every sync/pair call — not something the Android app writes to
directly, just useful for debugging sync issues from the DB side.

---

## Admin / ops

### `notification`
admin_id (FK→admin_user), title, message, notification_type, priority, is_read.

### `conflict`
attendance_id/attendance_session_id/student_id/device_id (FKs), conflict_type (CHECK:
`LOW_CONFIDENCE`, `DUPLICATE_ATTENDANCE`, `SYNC_FAILURE`, `MANUAL_REVIEW`, `DEVICE_ERROR`,
`UNKNOWN_FACE`), severity, conflict_status (`PENDING`/`UNDER_REVIEW`/`RESOLVED`/`REJECTED`),
resolved_by (FK→admin_user).

### `change_log`
admin_id (FK→admin_user, nullable — some system actions have no human actor), entity_name,
entity_id, action (CHECK: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `SYNC`, `RESOLVE`,
`EXPORT`), old_values/new_values (JSONB), action_timestamp. Passwords are never written into
old_values/new_values, only a boolean flag that a reset happened.

---

## What Android's local Room database should mirror

Based on what actually syncs down, the local schema only needs to shadow: `room` (just this
device's own row — id + number), `timetable` (filtered to this room), `student` (filtered to
batches taught in this room), `holiday` (all of them), and its own `attendance` rows pending
upload (`synced: Boolean` flag, matching the server column name/semantics exactly). Nothing
else in this document needs a local counterpart.
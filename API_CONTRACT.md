# FaceGate API Contract

---

## 1. Base URL & general shape

```
http://localhost:5000/api/v1
```

Every response is JSON, shaped one of two ways:

```json
{ "success": true,  "message": "...", "data": { ... } }
{ "success": false, "message": "..." }
```

`message` is sometimes omitted on success responses — don't assume it's
always present, only `success` and (on success) `data`.

---

## 2. Authentication

**There is no admin/website authentication.** No JWT, no login-protected
routes, nothing. Every admin-facing endpoint below (students, devices,
timetable, etc.) is completely open. `POST /admin/login` exists and checks a
bcrypt-hashed password, but doesn't issue a token — this is a deliberate,
documented decision (see the original architecture doc, Section 9): admin
auth is deferred to a later build.

**Devices** are the one thing that IS authenticated, via a per-device token:

```
x-api-key: <device_token>
```

Not `Authorization: Bearer`. This applies to:
- Every `/sync/*` endpoint
- `POST /devices/heartbeat`

It does **not** apply to `POST /devices/register` (can't require a token to
get a token) or `GET /devices/:deviceId` (open, by design, so a device can
look up its own room).

A request to a protected route without a valid `x-api-key` gets:
```json
{ "success": false, "message": "API Key missing" }     // no header, 401
{ "success": false, "message": "Invalid API Key" }      // wrong token, 401
{ "success": false, "message": "Device is disabled" }   // token valid, device inactive, 403
```

---

## 3. Device pairing — no admin-issued codes

**There is no pairing-code flow.** A device registers itself directly:

### `POST /devices/register` — no auth required

Request (snake_case):
```json
{
  "room_id": "uuid",
  "device_identifier": "any string unique-ish to this physical device",
  "device_name": "Tablet-LH101",
  "app_version": "1.0.0",
  "operating_system": "Android 14"
}
```
`app_version` is required — the `device` table has it `NOT NULL` with no
default.

Response — `data` is the full device row, **including `device_token`, which
is only ever returned here.** The device must persist it (there is no way
to retrieve it again later):
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "device_id": "uuid",
    "room_id": "uuid",
    "device_identifier": "...",
    "device_name": "Tablet-LH101",
    "device_type": "ANDROID_TABLET",
    "app_version": "1.0.0",
    "operating_system": "Android 14",
    "device_token": "uuid — THIS IS THE x-api-key VALUE",
    "device_status": "ACTIVE",
    "network_status": "ONLINE",
    "battery_percentage": null,
    "storage_available_mb": null,
    "last_heartbeat": null,
    "last_sync": null,
    "registration_date": "ISO timestamp",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp",
    "is_active": true
  }
}
```

**Known gap:** there is no endpoint to look up a Room ID by room number. An
admin currently has to hand the installer a raw Room UUID (copied from the
database/dashboard) to type in. Adding `GET /rooms` would fix this — not
built yet.

### `GET /devices/:deviceId` — no auth required
Same shape as the register response, useful to refresh room assignment
after an admin reassigns a device (per the architecture doc, reassignment
doesn't require re-pairing).

### `POST /devices/heartbeat` — **requires `x-api-key`**

Request — snake_case, same convention as the rest of the API:
```json
{ "battery_level": 88, "network_status": "ONLINE", "storage_available_mb": 3200 }
```
`deviceId` is **not** part of the body — it's taken from the authenticated
token. Sending one in the body does nothing.

Response:
```json
{
  "success": true,
  "message": "Heartbeat received",
  "data": { "success": true, "device": { /* full device row, same shape as register */ } }
}
```

---

## 4. Sync — 5 endpoints, not 11

There is **one combined** pull for timetable + students + holidays, not
separate calls per entity. There is **no face-embedding sync** and **no
attendance-session sync** endpoint — those don't exist on the backend yet.

### `POST /sync/full` — requires `x-api-key`
Same response shape as incremental below, minus the `updatedX` counts. Use
for the very first sync after pairing.

### `GET /sync/incremental?since=<ISO timestamp>` — requires `x-api-key`
`since` is optional — omit it and this behaves like a full pull.

```json
{
  "success": true,
  "message": "Incremental sync completed",
  "data": {
    "updatedTimetable": 2,
    "updatedStudents": 4,
    "updatedHolidays": 1,
    "timetable": [ { /* SyncTimetableDto, see below */ } ],
    "students":  [ { /* SyncStudentDto */ } ],
    "holidays":  [ { /* SyncHolidayDto */ } ],
    "lastSync": "ISO timestamp"
  }
}
```

**Room-scoped**: timetable = every period taught in this device's room;
students = everyone in a batch that has at least one class in this room.
Holidays are global (not room-scoped).

#### SyncTimetableDto (all snake_case)
```json
{
  "timetable_id": "uuid",
  "batch_id": "uuid", "batch_code": "CSE-2024-A",
  "faculty_id": "uuid", "faculty_name": "Rajesh Sharma",
  "subject_id": "uuid", "subject_code": "CS301", "subject_name": "Database Management Systems",
  "room_id": "uuid",
  "day_of_week": "Monday",
  "lecture_number": 1,
  "start_time": "09:00:00", "end_time": "10:00:00",
  "attendance_window_minutes": 15,
  "effective_from": "ISO date", "effective_to": null,
  "updated_at": "ISO timestamp"
}
```
`day_of_week` is a **name** (`"Monday"`.."Saturday"`), not a number.

#### SyncStudentDto
```json
{
  "student_id": "uuid", "batch_id": "uuid", "batch_code": "CSE-2024-A",
  "registration_number": "PEC2024001", "roll_number": "23103001",
  "first_name": "Mahima", "last_name": "Goyal",
  "email": "...", "phone": "...", "gender": "Female",
  "student_status": "ACTIVE",
  "updated_at": "ISO timestamp"
}
```

#### SyncHolidayDto
```json
{
  "holiday_id": "uuid", "holiday_date": "ISO date",
  "holiday_name": "Independence Day", "holiday_type": "NATIONAL",
  "is_recurring": true, "updated_at": "ISO timestamp"
}
```

### `POST /sync/attendance` — requires `x-api-key`

**This is the one place the contract had to change the data model, not
just the field names.** `attendance.attendance_session_id` has a hard
foreign key to `attendance_session`, and there is no separate "start
session" endpoint — nothing else creates that row. `attendance_session`
also has `UNIQUE(timetable_id, session_date)`: exactly one session per
class period per day, system-wide.

So a device does **not** invent and send an authoritative session ID.
Instead, every record carries `timetable_id` + `session_date`, and the
backend resolves — creating on first use — the one real session row for
that period. Two devices (or one device across a sync retry) sending
records for the same period on the same day converge on the same server
session automatically.

Request:
```json
{
  "records": [
    {
      "session_id": "uuid — LOCAL bookkeeping only, ignored by the server for identity",
      "timetable_id": "uuid — required, must match a real timetable row",
      "session_date": "yyyy-MM-dd — required",
      "student_id": "uuid",
      "status": "PRESENT",
      "attendance_mode": "FACE_RECOGNITION",
      "confidence": 97.8,
      "timestamp": "ISO timestamp"
    }
  ]
}
```

Upsert is on `(session, student)` — safe to resend the same record; the
last value wins. Response:
```json
{
  "success": true,
  "message": "Attendance uploaded successfully",
  "data": { "uploadedRecords": 1, "failedRecords": 0, "status": "SUCCESS" }
}
```
`status` is `"PARTIAL"` if some records in the batch failed (e.g. a bad
`timetable_id`) while others succeeded.

### `GET /sync/status` — requires `x-api-key`
```json
{
  "success": true,
  "data": {
    "deviceStatus": "ACTIVE", "networkStatus": "ONLINE",
    "syncStatus": "SUCCESS", "lastSync": "ISO timestamp", "lastError": null
  }
}
```

### `POST /sync/retry` — requires `x-api-key`
Re-runs an incremental sync server-side. Response is the same shape as
`/sync/incremental`, plus `"retried": true`.

---

## 5. Admin dashboard endpoints (all open, no auth)

| Method | Path | Notes |
|---|---|---|
| GET | `/students` | No server-side search/filter — returns everyone active |
| GET | `/students/batch/:batchId` | |
| GET | `/students/:studentId` | |
| POST | `/students` | body: `batch_id, registration_number, roll_number, first_name, last_name, gender, admission_year` required; `email, phone, date_of_birth, profile_photo_url` optional |
| PUT | `/students/:studentId` | |
| DELETE | `/students/:studentId` | soft delete (`is_active = false`) |
| GET | `/devices` | |
| GET | `/devices/status` | counts: total/online/offline |
| PUT | `/devices/:deviceId` | |
| DELETE | `/devices/:deviceId` | soft delete, sets `device_status = 'INACTIVE'` |
| GET | `/timetable` / `/timetable/today` / `/timetable/batch/:id` / `/timetable/faculty/:id` | |
| POST `/timetable`, PUT/DELETE `/timetable/:id` | | |
| POST | `/attendance/mark` | direct manual-attendance path (distinct from `/sync/attendance` — no timetable/session auto-create logic here, expects an existing session) |
| GET | `/attendance/summary/:sessionId`, `/attendance/session/:sessionId`, `/attendance/student/:studentId` | |
| PUT/DELETE | `/attendance/:attendanceId` | |
| GET/POST | `/holidays` | POST requires `holiday_date, holiday_name, holiday_type, academic_year, semester` — the last two because holidays are backed by `academic_calendar`, which requires them |
| PUT/DELETE | `/holidays/:holidayId` | |
| GET/POST | `/conflicts` | |
| PUT | `/conflicts/:conflictId/resolve` | body: `{ "resolution": "..." }` |
| DELETE | `/conflicts/:conflictId` | |
| GET/POST | `/notifications` | |
| PUT | `/notifications/:notificationId/read` | |
| DELETE | `/notifications/:notificationId` | |
| POST | `/admin/login` | body `{email, password}` — checks bcrypt hash, returns admin profile, **no token issued** |
| POST | `/admin/logout`, GET/PUT `/admin/profile`, PUT `/admin/change-password` | no session concept — these act on "the first active admin" if no ID given, since there's no login session to identify "current admin" |
| GET | `/dashboard/summary`, `/dashboard/attendance`, `/dashboard/conflicts`, `/dashboard/notifications` | |
| GET | `/reports/summary`, `/reports/daily`, `/reports/student/:studentId`, `/reports/faculty/:facultyId`, `/reports/department/:departmentId` | **No** `/reports/batch/:id`, `/reports/subject/:id`, or `/reports/export` — these don't exist despite the web frontend having UI for them |

---

## 6. Known gaps (don't build against these until they exist)

- **Face embedding sync** — no `face_embedding` table wiring, no routes. A
  student's embedding, however it's captured on-device, currently has no
  path to the backend or to other devices in the same room.
- **Batch/subject-level reports, CSV export** — web UI references these;
  backend doesn't have them.
- **Room lookup** — no `GET /rooms`. Device pairing requires a raw Room
  UUID typed in by hand.
- **"Extra period" attendance** — the Android app supports starting an
  ad-hoc session not tied to any timetable row. `attendance_session.timetable_id`
  is `NOT NULL`, so these sessions structurally cannot be synced as things
  stand. Attendance from them stays local-only.
- **Conflict upload from device** — the on-device conflict-detection entity
  (`ConflictEntity`, rich recognition-decision data: top/second candidate,
  scores, reason) has no corresponding sync call. Conflicts are currently
  only ever created directly via `POST /conflicts` from the admin side, or
  by hand.
- **Route-level auth** — every admin endpoint in Section 5 is open. Fine
  for the current build (per architecture doc Section 9); revisit before
  any real deployment.

---

## 7. Local entity ↔ backend field mapping (Android)

For whoever's touching `com.facegate.storage.entity` next — these are the
fields added specifically to bridge local Room storage to this contract,
and what they're for:

| Entity | Added field | Why |
|---|---|---|
| `StudentEntity` | `rollNumber`, `batchCode` | Display fields; `studentId` (the PK) now holds the server's real `student_id` UUID — it used to incorrectly hold the roll number |
| `AttendanceEntity` | `attendanceStatus`, `confidence`, `deviceId` | Previously always pushed as a hardcoded `PRESENT` / `0.0` — nothing recorded the real recognition result |
| `TimetableEntity` | `remoteTimetableId`, `subjectName`, `facultyName` | Bridges the local `Int` autoincrement PK to the server's UUID `timetable_id`. Local `id` stays the Room PK (too much existing code depends on it being an `Int`); `remoteTimetableId` is what sync actually needs |
| `SessionEntity` | `remoteTimetableId`, `sessionDate` | Required on every session whose attendance will be pushed — see Section 4 above on why the server resolves sessions itself. A session missing either field is skipped at sync time (logged, not silently dropped) |

`ConflictEntity` and `OverrideEntity`/`WeeklyOffEntity` have no backend
equivalent at all and aren't part of this contract.

---

## 8. Verification

Every request/response shape in this document was captured by actually
calling the endpoint against a running instance (Postgres 16 + the Express
API in this repo), not inferred from the schema or route file alone. If
you find a mismatch between this doc and reality, the backend has likely
changed since — re-verify rather than assuming this doc or the code is
right.
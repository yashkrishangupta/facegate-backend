# FaceGate API Reference

Base URL: `{API_URL}/api/v1`. Written to make the Android fix straightforward — Part 1 is
everything the app actually calls, in full detail. Part 2 is the rest of the API (website
traffic only) as a summary table, since Android never calls it.

Companion doc: `database.md`, for the tables these endpoints read/write.

---

## Auth model — two separate systems, don't mix them up

| | Website (browser) | Android app |
|---|---|---|
| Credential | JWT, `Authorization: Bearer <token>` | Device token, `x-api-key: <device_token>` |
| Obtained via | `POST /admin/login` (username + password) | `POST /devices/pair` (pairing code) |
| Who | Admin/Faculty/Viewer human | The paired device itself |
| Expiry | 12h (configurable, `JWT_EXPIRES_IN`) | Never — until an admin deactivates the device |

The Android app should **never** see or handle a JWT. It only ever needs `x-api-key`.

---

# Part 1 — Endpoints Android calls

## 1. Pair Device (first launch)

```
POST /devices/pair
```
No auth header. This is the call that *obtains* the device's credential.

**Request**
```json
{
  "pairing_code": "482913",
  "device_identifier": "Samsung-SM-T510-a1b2c3d4",
  "app_version": "1.0.0",
  "operating_system": "Android 14"
}
```
`pairing_code` is the 6-digit code an admin generated on the website (`POST /devices`,
website-only, see Part 2). Valid 15 minutes, single-use.

**Success — 200**
```json
{
  "success": true,
  "message": "Device paired successfully",
  "data": {
    "deviceId": "3fa2...",
    "deviceToken": "9e7c...",
    "roomId": "6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1"
  }
}
```
Save `deviceToken` as the permanent `x-api-key` and `deviceId`/`roomId` locally — this is the
only response that ever contains the token.

**Errors — 400**: code missing, unknown, expired, or already redeemed.

---

## 2. Heartbeat

```
POST /devices/heartbeat
Header: x-api-key: <device_token>
```
Call periodically (every few minutes) so the website's device list shows accurate
online/battery/storage status.

**Request**
```json
{
  "battery_level": 78,
  "storage_available_mb": 18234,
  "network_status": "ONLINE"
}
```
No `deviceId` in the body — the server identifies the caller from `x-api-key`, never trusts a
body-supplied ID (that would let one device spoof another's heartbeat).

**Success — 200**
```json
{ "success": true, "message": "Heartbeat received", "data": {} }
```

---

## 3. Full Sync

```
POST /sync/full
Header: x-api-key: <device_token>
```
Call once right after pairing, and any time a from-scratch resync is needed (e.g. local DB
was cleared). Pulls **everything** relevant to this device's room — no `since` filter.

**Success — 200**
```json
{
  "success": true,
  "data": {
    "timetable": [ /* see shape below */ ],
    "students": [ /* see shape below */ ],
    "holidays": [ /* see shape below */ ],
    "lastSync": "2026-07-11T10:45:00Z"
  }
}
```

### `timetable[]` row shape
```json
{
  "timetable_id": "uuid",
  "batch_id": "uuid", "batch_code": "CS-2024-A",
  "faculty_id": "uuid", "faculty_name": "Amit Sharma",
  "subject_id": "uuid", "subject_code": "CS301", "subject_name": "Operating Systems",
  "room_id": "uuid",
  "day_of_week": "Monday",
  "lecture_number": 3,
  "start_time": "10:00:00", "end_time": "11:00:00",
  "attendance_window_minutes": 15,
  "effective_from": "2026-01-01", "effective_to": null,
  "updated_at": "2026-07-10T09:00:00Z"
}
```
Filter is `room_id = <this device's room>` — never filtered by batch directly.

### `students[]` row shape
```json
{
  "student_id": "uuid", "batch_id": "uuid", "batch_code": "CS-2024-A",
  "registration_number": "2024CS001", "roll_number": "01",
  "first_name": "Riya", "last_name": "Verma",
  "email": "riya@example.edu", "phone": "9876543210",
  "gender": "Female", "student_status": "ACTIVE",
  "updated_at": "2026-07-09T12:00:00Z"
}
```
Filter is **room + batch composite**: `batch_id IN (SELECT batch_id FROM timetable WHERE
room_id = <this room>)` — i.e. only students in a batch that's actually taught in this room.
No face embedding is included here — embeddings are a separate concern, not currently wired
into this payload (see "Known gaps" at the bottom).

### `holidays[]` row shape
```json
{
  "holiday_id": "uuid", "holiday_date": "2026-08-15",
  "holiday_name": "Independence Day", "holiday_type": "NATIONAL",
  "is_recurring": true, "updated_at": "2026-06-01T00:00:00Z"
}
```
**Not room-filtered** — every device gets every active holiday.

---

## 4. Incremental Sync

```
GET /sync/incremental?since=2026-07-10T09:00:00Z
Header: x-api-key: <device_token>
```
Same three collections as Full Sync, but each filtered to `updated_at > since`. Call this on
a periodic background job (WorkManager) instead of Full Sync once the device has synced at
least once. Store the `lastSync` timestamp from the previous response and pass it as `since`.

**Success — 200**
```json
{
  "success": true,
  "data": {
    "updatedTimetable": 2,
    "updatedStudents": 5,
    "updatedHolidays": 0,
    "timetable": [ /* same shape as Full Sync, only changed rows */ ],
    "students": [ /* same shape as Full Sync, only changed rows */ ],
    "holidays": [ /* same shape as Full Sync, only changed rows */ ],
    "lastSync": "2026-07-11T10:45:00Z"
  }
}
```
This endpoint doesn't tell you about **deletions** (a student/timetable row going inactive) —
it only returns rows whose `updated_at` moved forward, and a soft-delete does bump
`updated_at`, but the row still comes back with whatever active/inactive flag it now has
(check `is_active`/`student_status` client-side, don't assume "returned" means "still valid").

---

## 5. Upload Attendance (batch, offline-safe — the primary path)

```
POST /sync/attendance
Header: x-api-key: <device_token>
```
This is the endpoint the sync worker should push through, whether it's one record or a
backlog from being offline. **Idempotent** — safe to retry the whole batch if the network
drops mid-request.

**Request**
```json
{
  "records": [
    {
      "timetable_id": "uuid",
      "session_date": "2026-07-11",
      "student_id": "uuid",
      "status": "PRESENT",
      "attendance_mode": "FACE_RECOGNITION",
      "confidence": 0.94,
      "timestamp": "2026-07-11T10:05:23Z"
    }
  ]
}
```
Note it's `timetable_id` + `session_date`, **not** a session UUID — the device never invents
a session ID. The server resolves (creating on first use) the one real
`attendance_session` row for that period via the `uq_session_per_day` constraint, so two
devices or a restarted app can't create duplicate sessions for the same class.

`status` defaults to `PRESENT` if omitted; `attendance_mode` defaults to
`FACE_RECOGNITION`; `timestamp` defaults to server-received-time if omitted.

**Success — 200**
```json
{
  "success": true,
  "data": {
    "uploadedRecords": 4,
    "failedRecords": 0,
    "status": "SUCCESS"
  }
}
```
`status` is `"PARTIAL"` if some records failed — check `failedRecords` and retry the batch
(the successful ones will just no-op via the upsert). Mark local rows `synced = true` only
for the ones the server actually accepted, not the whole batch, if you want to be precise —
though in practice a full-batch retry is harmless since the upsert is on
`(session, student)`, not append-only.

---

## 6. Mark Attendance (single record — secondary path)

```
POST /attendance/mark
Header: x-api-key: <device_token>
```
**Different contract from #5** — this expects an actual `session_id` UUID that must already
exist (it does *not* resolve one from `timetable_id`+`session_date`). Only useful if the app
already has a session ID cached locally (e.g. from a prior sync or a "session started" event)
— for most real-time face-recognition marks, prefer #5, which is more forgiving.

**Request**
```json
{
  "session_id": "uuid",
  "student_id": "uuid",
  "device_id": "uuid",
  "status": "PRESENT",
  "attendance_mode": "FACE_RECOGNITION",
  "confidence": 0.94,
  "remarks": null
}
```

**Success — 201**
```json
{ "success": true, "message": "Attendance marked successfully", "data": { /* attendance row */ } }
```

---

## 7. Sync Status

```
GET /sync/status
Header: x-api-key: <device_token>
```
**Success — 200**
```json
{
  "success": true,
  "data": {
    "deviceStatus": "ACTIVE",
    "networkStatus": "ONLINE",
    "syncStatus": "SUCCESS",
    "lastSync": "2026-07-11T10:45:00Z",
    "lastError": null
  }
}
```

## 8. Retry Sync

```
POST /sync/retry
Header: x-api-key: <device_token>
```
Just re-runs an incremental sync server-side and logs it — a convenience wrapper, not
materially different from calling #4 yourself. `data` shape matches #4's response.

## 9. Get This Device's Own Details

```
GET /devices/{deviceId}
```
No auth required on the backend (never returns `device_token`, so nothing to protect).
Useful to pick up a room reassignment — if an admin moves this device to a different room,
the device won't know until it calls this (or gets a `room_id` mismatch some other way) and
re-syncs against the new room.

**Success — 200**
```json
{
  "success": true,
  "data": {
    "device_id": "uuid", "room_id": "uuid", "device_name": "Front Door Tablet",
    "device_status": "ACTIVE", "battery_percentage": 82,
    "last_heartbeat": "2026-07-11T10:50:00Z", "last_sync": "2026-07-11T10:45:00Z"
  }
}
```

---

## Known gaps (things Android might currently assume that aren't real)

- **No face-embedding sync exists yet.** The architecture doc envisioned embeddings
  syncing between devices; the current `students[]` payload doesn't include one. If the app
  is trying to read an embedding field off the student sync response, that's the bug —
  there isn't one there.
- **No attendance-down sync.** A manual correction made on the website (Reports page) does
  not currently flow back to any device. If the app expects to reconcile server-side edits
  during incremental sync, it won't see them — this is planned but not built.
- **Deletions aren't explicit.** As noted under Incremental Sync, watch `is_active` /
  `student_status` on returned rows rather than expecting a separate "removed" list.

---

# Part 2 — Website-only endpoints (reference table)

Android never calls any of these. Included for completeness / in case the app UI ever needs
to link out to the website. All require `Authorization: Bearer <jwt>` unless noted.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/admin/login` | none | Get a JWT (username + password) |
| POST | `/admin/logout` | any role | No-op (stateless JWT) |
| GET/PUT | `/admin/profile` | any role | View/edit own profile |
| PUT | `/admin/change-password` | any role | Self-service, needs current password |
| GET | `/admin` | ADMIN+ | List admins |
| PUT | `/admin/:id/security` | SUPER_ADMIN | Role/status/password **reset** (no current password needed) |
| DELETE | `/admin/:id` | SUPER_ADMIN | Deactivate an admin |
| GET/POST/PUT/DELETE | `/faculty` | GET: any role · writes: ADMIN+ | Faculty CRUD; POST auto-creates a login |
| GET/POST/PUT/DELETE | `/departments` | GET: any role · writes: ADMIN+ | |
| GET/POST/PUT/DELETE | `/subjects` | GET: any role · writes: ADMIN+ | supports `?program=&semester=` |
| GET/POST/PUT/DELETE | `/academic-calendar` | GET: any role · writes: ADMIN+ | supports `?academic_year=&semester=` |
| GET | `/change-log` | ADMIN+ | supports `?entity_name=&action=&admin_id=&from_date=&to_date=` |
| GET/POST/PUT/DELETE | `/rooms` | GET: any role · writes: ADMIN+ | |
| GET/POST/PUT/DELETE | `/devices` | any role (GET) / ADMIN+ (write) | POST creates a **pending** device + pairing code, doesn't pair it |
| GET/POST/PUT/DELETE | `/students` | GET: any role · writes: ADMIN+ | |
| GET/POST/PUT/DELETE | `/timetable` | GET: any role · writes: ADMIN+ | also `/timetable/today`, `/timetable/batch/:id`, `/timetable/faculty/:id` |
| GET/POST/PUT/DELETE | `/holidays` | GET: any role · writes: ADMIN+ | |
| GET/POST/PUT/DELETE | `/conflicts` | GET/resolve: any role · create/delete: ADMIN+ | resolve = `PUT /conflicts/:id/resolve` |
| GET/POST/PUT/DELETE | `/notifications` | GET: any role · writes: ADMIN+ | |
| GET | `/dashboard/summary` \| `/attendance` \| `/conflicts` \| `/notifications` | any role | dashboard widgets |
| GET | `/reports/summary` \| `/daily` \| `/student/:id` \| `/faculty/:id` \| `/department/:id` | any role | ⚠️ faculty row-scoping ("only my batches") not yet enforced — any authenticated role currently sees everything |
| GET/PUT/DELETE | `/attendance` (session/student/:id) | any role (GET) · ADMIN+ (write) | manual corrections from the website |

⚠️ **Not implemented despite being referenced elsewhere**: `POST /attendance/manual`,
`GET /devices/:id/health`, `GET /devices/:id/sync-history`, `GET /reports/export`. Don't
build against these — they don't exist yet.
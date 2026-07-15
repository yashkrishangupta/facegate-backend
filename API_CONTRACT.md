# FaceGate API Reference

Base URL: `{API_URL}/api/v1`

Companion doc: `database.md`, for the tables these endpoints read/write.

---

## 1. Auth model

Two independent credential systems — a request never carries both.

| | Website (admin/faculty) | Android device |
|---|---|---|
| Header | `Authorization: Bearer <jwt>` | `x-api-key: <device_token>` |
| Obtained via | `POST /admin/login` | `POST /devices/pair` |
| Expiry | 12h (`JWT_EXPIRES_IN`) | Never, until deactivated |
| Roles | `SUPER_ADMIN`, `ADMIN`, `FACULTY`, `VIEWER` | N/A — a device is a device |

**Access legend used throughout this document:**
- `Public` — no header needed.
- `Auth` — any authenticated role (`requireAuth`).
- `Admin+` — `SUPER_ADMIN` or `ADMIN` only (`requireAdmin`).
- `Super Admin` — `SUPER_ADMIN` only (`requireSuperAdmin`).
- `Device` — `x-api-key` (`deviceAuth`).

**Faculty row-scoping — current coverage.** A `FACULTY`-role caller is now actually filtered
to their own data in three places: `GET /attendance/session/:sessionId` and
`GET /attendance/student/:studentId` (only rows tied to sessions they teach),
`GET /conflicts` (same), and `GET /reports/faculty/:facultyId` (blocked outright from
querying another faculty member's ID). The daily/summary/department report aggregates
remain visible to every role — a deliberate choice, not an oversight, since those don't
expose another specific faculty member's individual student data.

---

## 2. Device pairing (detail — the table below only summarizes this)

**Step 1 — Create Device (admin, website):**
```json
POST /devices  { "room_id": "uuid", "device_name": "Front Door Tablet" }
```
→ `201` `{ data: { deviceId, roomId, deviceName, pairingCode, pairingCodeExpiresAt } }`
No `device_token` yet. Code expires in 15 minutes, single-use. One
`ACTIVE`/`PENDING_PAIRING` device per room, enforced at the DB level and pre-checked.

**Step 2 — Pair Device (physical device, first app launch):**
```json
POST /devices/pair
{
  "pairing_code": "482913",
  "device_identifier": "Samsung-SM-T510-a1b2c3d4",
  "app_version": "1.0.0",
  "operating_system": "Android 14"
}
```
→ `200` `{ data: { deviceId, deviceToken, roomId } }` — the only response that ever returns
`device_token`.

---

## 3. Sync (detail)

Full/incremental sync response shape:
```json
{
  "timetable": [...], "students": [...], "holidays": [...],
  "embeddings": [...], "attendanceUpdates": [...],
  "lastSync": "..."
}
```
- **Timetable** filtered by `room_id`.
- **Students** filtered by room + batch composite (batches actually taught in this room).
  Includes `enrollment_status`, never the embedding itself.
- **Holidays** global — every device gets every active holiday.
- **Embeddings** *(new)* — active face embeddings for students in this room's batches:
  `{ student_id, embedding_data, embedding_version, model_name, confidence_threshold,
  updated_at }`. `embedding_data` is the raw feature vector as JSON, opaque to the sync
  protocol itself.
- **attendanceUpdates** *(new)* — server-authored attendance changes (typically a website
  manual correction) for this room's sessions: `{ attendance_id, timetable_id, session_date,
  student_id, status, attendance_mode, attendance_time, updated_at }`. Full sync caps the
  lookback at 30 days; incremental uses the same `since` filter as everything else.
  **Merge rule**: compare `updated_at` against the local row for the same
  `(timetable_id, session_date, student_id)` — most-recent-wins, regardless of source.
  Implemented end-to-end, including the Android-side merge against the local Room database
  (`AttendanceSyncWorker.mergeAttendanceDown` → `AttendanceDao.applyServerUpdateIfNewer`).

**Upload attendance** — unchanged: `{ records: [{ timetable_id, session_date, student_id,
status, attendance_mode, confidence, timestamp }] }`, idempotent, upserts on
`(attendance_session_id, student_id)`.

**Upload embedding** *(new)*:
```json
POST /sync/embeddings
{ "student_id": "uuid", "embedding_data": {...}, "embedding_version": "v1.0",
  "model_name": "facenet-v2", "confidence_threshold": 75.0 }
```
Upserts on `student_id` server-side — re-enrolling a student replaces the old vector rather
than erroring or duplicating.

**Enroll student** *(new)* — device-initiated new student + embedding, one atomic call:
```json
POST /sync/students/enroll
{ "student_id": "uuid", "batch_code": "CS-2024-A", "registration_number": "...",
  "roll_number": "...", "first_name": "...", "last_name": "...", "gender": "Male",
  "admission_year": 2024, "date_of_birth": "2005-01-01", "email": "...", "phone": "...",
  "embedding_data": [...], "embedding_version": "v1.0", "model_name": "facenet-v2" }
```
→ `201` `{ data: { student_id, embedding_id } }`. `student_id` is client-generated so the
local and server rows share an id from the start; upserts on `student_id` (both the student
row and the embedding row), so a retried request is safe. `batch_code` is resolved to
`batch_id` server-side — 400 if no active batch matches.

**Push conflicts** *(new)* — batched, mirrors attendance upload's session resolution:
```json
POST /sync/conflicts
{ "records": [{ "timetable_id": "uuid", "session_date": "2026-07-13",
  "student_id": "uuid|null", "conflict_type": "LOW_CONFIDENCE", "severity": "MEDIUM",
  "description": "..." }], "client_refs": [0] }
```
→ `{ data: { created: [{ client_ref, conflict_id }] } }`. Each record resolves/creates its
`attendance_session` the same way attendance upload does; a record with no resolvable
`timetable_id`/`session_date` fails that row only (`conflict.attendance_session_id` is
`NOT NULL`, so it can't be created with neither).

**Resolve conflict** *(new)* — device-authed equivalent of the website's `/conflicts/:id/resolve`:
```json
PUT /sync/conflicts/:conflictId/resolve
{ "conflict_status": "RESOLVED" }
```
`RESOLVED` or `REJECTED` only. `resolved_by` stays `NULL` (a device has no `admin_id`); the
device's identity is recorded in `resolution_notes` instead.

**Reports** *(new)* — read-only, room-scoped session summaries:
```
GET /sync/reports?since=<ISO timestamp>
```
→ `{ data: [{ timetable_id, session_date, subject_name, batch_code, total_students,
present_students, absent_students, updated_at }] }`. `since` optional, defaults to a 7-day
lookback.

**Conflicts down** *(new)* — both full and incremental sync responses now also include a
`conflicts[]` array (same shape as the `SyncConflictDto` the Android app already expected),
scoped to this device's room, so a website-side resolution (or an admin-raised conflict)
reaches the device too, not just conflicts the device itself detected.

---

## 4. Manual attendance (detail)

```json
POST /attendance/manual
{ "timetable_id": "uuid", "session_date": "2026-07-13",
  "records": [{ "student_id": "uuid", "status": "PRESENT" }] }
```
Resolves/creates the `attendance_session` from `(timetable_id, session_date)` the same way
the device sync path does — deliberately, since the website has no separate way to create a
session, so requiring a pre-existing `session_id` would make this uncallable for any period
nobody has synced yet.

---

## 5. Conflict status transitions (detail)

- `PUT /:conflictId/resolve` — sets `RESOLVED` specifically, requires resolution notes.
- `PUT /:conflictId/status` `{ status: "UNDER_REVIEW" | "REJECTED", notes? }` — direct
  transition, previously unreachable through the UI (only `PENDING`/`RESOLVED` were ever set
  anywhere).
- `DELETE /:conflictId` — soft-delete (`is_active = false`), still distinct from
  `status = 'REJECTED'`.

---

## 6. Complete endpoint reference

## Admin & Auth — /admin
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /login | Public | { username, password } → { token, admin } |
| POST | /logout | Auth | Stateless JWT, no server-side effect |
| GET | /profile | Auth | Own profile |
| PUT | /profile | Auth | Name/phone/email only — not role/status/password |
| PUT | /change-password | Auth | Self-service, requires currentPassword |
| GET | / | Admin+ | List all admins |
| POST | / | Super Admin | Create a plain ADMIN/SUPER_ADMIN/VIEWER account directly (not via Faculty) |
| PUT | /:adminId/security | Super Admin | Reset password / role / status — no currentPassword needed |
| DELETE | /:adminId | Super Admin | Soft-deactivate |

## Faculty — /faculty
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth | Includes linked admin_id/username/account_status |
| GET | /:facultyId | Auth |  |
| POST | / | Admin+ | Also provisions a login account atomically |
| PUT | /:facultyId | Admin+ | Syncs name/email/phone to linked admin_user |
| DELETE | /:facultyId | Admin+ | Also disables the linked login |

## Rooms — /rooms
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth |  |
| GET | /:roomId | Auth |  |
| POST | / | Admin+ | Required: room_number, building_name, room_type, capacity |
| PUT | /:roomId | Admin+ |  |
| DELETE | /:roomId | Admin+ |  |

## Devices — /devices
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /pair | Public | Physical device redeems a pairing code — see Android section |
| POST | /heartbeat | Device | { battery_level, storage_available_mb, network_status } |
| GET | / | Auth |  |
| GET | /status | Auth |  |
| GET | /:deviceId | Auth | Never returns device_token |
| GET | /:deviceId/health | Auth | Live battery/network/last-sync snapshot |
| GET | /:deviceId/sync-history | Auth | Last 100 sync log entries |
| POST | / | Admin+ | Creates a PENDING device + pairing code |
| PUT | /:deviceId | Admin+ | Room reassignment goes through here |
| DELETE | /:deviceId | Admin+ |  |
| POST | /change-log | Device | *(new)* Device-scoped equivalent of the website's read-only GET /change-log — pushes `{ events: [{ entity_name, entity_id, action, description, occurred_at }] }` |
| GET | /me | Device | *(new)* Device self-check — returns this device's own row (room_id etc.), never device_token. This is what GET /:deviceId was always documented as being usable for; that route is requireAuth-only and always 401s a device — see §9 |

## Sync (device-only) — /sync
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /full | Device | Everything for this device's room, no since filter |
| GET | /incremental | Device | ?since=<ISO timestamp> — only changed rows |
| POST | /attendance | Device | Batch upload, idempotent — see Android section |
| POST | /embeddings | Device | Upload a newly-captured face embedding — upserts on student_id |
| POST | /students/enroll | Device | *(new)* Device-initiated new student + embedding, one atomic call — upserts on student_id |
| POST | /conflicts | Device | *(new)* Push device-detected conflicts, batched — see §3 |
| PUT | /conflicts/:conflictId/resolve | Device | *(new)* Resolve/reject a conflict from the device — RESOLVED or REJECTED only |
| GET | /reports | Device | *(new)* Read-only, room-scoped session summaries — ?since=<ISO timestamp> |
| GET | /status | Device |  |
| POST | /retry | Device | Re-runs an incremental sync server-side |

## Attendance — /attendance
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /mark | Device | Single record, requires an existing session_id |
| POST | /manual | Auth | Bulk, whole session at once — resolves session from timetable_id+session_date, like the device path |
| GET | /summary/:sessionId | Auth |  |
| GET | /session/:sessionId | Auth |  |
| GET | /student/:studentId | Auth |  |
| PUT | /:attendanceId | Auth | Manual correction from the website |
| DELETE | /:attendanceId | Auth |  |

## Students — /students
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth | Filters: academic_year, program_id, semester, batch_id, department_id |
| GET | /batch/:batchId | Auth |  |
| GET | /:studentId | Auth | Includes enrollment_status (never the embedding itself) |
| POST | / | Admin+ | Required: batch_id, registration_number, roll_number, first_name, last_name, gender, admission_year |
| PUT | /:studentId | Admin+ |  |
| DELETE | /:studentId | Admin+ |  |

## Timetable — /timetable
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /today | Auth |  |
| GET | /batch/:batchId | Auth |  |
| GET | /faculty/:facultyId | Auth |  |
| GET | / | Auth | Filters: academic_year, program_id, semester, batch_id, room_id |
| POST | / | Admin+ | effective_from defaults to today if omitted; rejects a room/faculty clash with a different batch |
| PUT | /:timetableId | Admin+ |  |
| DELETE | /:timetableId | Admin+ |  |

## Batches — /batches
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth | Filters: academic_year, program_id, semester, department_id |
| GET | /:batchId | Auth |  |
| POST | / | Admin+ | Required: department_id, batch_code, program_id, academic_year, semester, section, strength |
| PUT | /:batchId | Admin+ |  |
| DELETE | /:batchId | Admin+ |  |

## Programs — /programs
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth |  |
| GET | /:programId | Auth |  |
| POST | / | Admin+ | Required: program_code, program_name, degree_type, duration_years |
| PUT | /:programId | Admin+ |  |
| DELETE | /:programId | Admin+ |  |

## Departments — /departments
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth |  |
| GET | /:departmentId | Auth |  |
| POST | / | Admin+ | Required: department_code, department_name |
| PUT | /:departmentId | Admin+ |  |
| DELETE | /:departmentId | Admin+ |  |

## Subjects — /subjects
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth | Filters: program_id, semester, department_id |
| GET | /:subjectId | Auth |  |
| POST | / | Admin+ | Required: department_id, subject_code, subject_name, program_id, semester, credits, subject_type, contact_hours_per_week |
| PUT | /:subjectId | Admin+ |  |
| DELETE | /:subjectId | Admin+ |  |

## Academic Calendar — /academic-calendar
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth | Filters: academic_year, semester |
| GET | /:calendarId | Auth |  |
| POST | / | Admin+ | Required: calendar_date, academic_year, semester |
| PUT | /:calendarId | Admin+ |  |
| DELETE | /:calendarId | Admin+ |  |

## Holidays — /holidays
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth |  |
| GET | /:holidayId | Auth |  |
| POST | / | Admin+ | Auto-upserts the matching academic_calendar row |
| PUT | /:holidayId | Admin+ |  |
| DELETE | /:holidayId | Admin+ |  |

## Conflicts — /conflicts
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth | Filters: status, severity, conflict_type, room_id, from_date, to_date |
| GET | /:conflictId | Auth |  |
| POST | / | Admin+ |  |
| PUT | /:conflictId/resolve | Auth | Sets RESOLVED specifically, requires notes |
| PUT | /:conflictId/status | Auth | Direct transition to UNDER_REVIEW or REJECTED |
| DELETE | /:conflictId | Admin+ | Soft-delete |

## Notifications — /notifications
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Auth |  |
| GET | /:notificationId | Auth |  |
| POST | / | Admin+ | Now has a dedicated frontend page (list + create) |
| PUT | /:notificationId/read | Auth |  |
| DELETE | /:notificationId | Admin+ |  |

## Reports — /reports
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /summary | Auth |  |
| GET | /daily | Auth |  |
| GET | /export | Auth | CSV export — ?reportType=student|batch|subject&id=&from=&to= |
| GET | /student/:studentId | Auth |  |
| GET | /faculty/:facultyId | Auth | FACULTY role blocked from querying another faculty member's ID |
| GET | /department/:departmentId | Auth |  |

## Dashboard — /dashboard
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /summary | Auth |  |
| GET | /attendance | Auth |  |
| GET | /conflicts | Auth |  |
| GET | /notifications | Auth |  |

## Change Log — /change-log
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | Admin+ | Filters: entity_name, action, admin_id, from_date, to_date |
---

## 7. Timetable double-booking guard (detail)

`POST /timetable` now rejects a create if a *different* batch already has an overlapping
room or faculty booking at the same `day_of_week` and time range:
`"Room is already booked for batch <code> at this day/time"` or the faculty equivalent.
The pre-existing DB unique constraint still separately catches a clash for the *same* batch.
**Caveat: only checked on create, not on update** — editing an existing period's time/room
isn't re-validated against this.

---

## 8. Device diagnostics (detail)

`GET /:deviceId/health` → `{ batteryLevel, networkStatus, storageAvailable, lastSeen,
syncStatus, lastSyncType, lastError }` — reads the device's own row plus its most recent
`device_sync_log` entry.

`GET /:deviceId/sync-history` → last 100 `device_sync_log` rows, newest first — this table
was already being written to on every sync/pair call; these endpoints just expose it.
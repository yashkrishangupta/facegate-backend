# FaceGate API Contract

# 1. Authentication Module
## Module Overview

The Authentication module is responsible for verifying administrator credentials, generating secure access tokens, maintaining user sessions, and authorizing access to the FaceGate backend.

All protected endpoints require a valid JWT Bearer Token issued after successful authentication.

## 1. Login API
## Endpoint
POST /api/v1/auth/login

## Description
Authenticates an administrator and returns a JWT access token for accessing protected APIs.

## Authentication
Not Required

## Request Headers
Header	Value
Content-Type	application/json

## Request Body
{
  "email": "admin@pec.edu.in",
  "password": "StrongPassword123"
}
## Validation Rules
Field	Rules
email	Required, valid email
password	Required
## Success Response
HTTP Status
200 OK
## Response Body
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "7c0c15b7-f9d0-48f6-8a9e-0f3a6d8c5d71",
      "employeeId": "PECADM001",
      "name": "Dr. Anjali Sharma",
      "email": "admin@pec.edu.in",
      "role": "SUPER_ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5...",
    "expiresIn": 3600
  }
}
## Error Responses
### Invalid Credentials
401 Unauthorized
{
    "success": false,
    "message": "Invalid email or password"
}
### Account Disabled
403 Forbidden
{
    "success": false,
    "message": "Account has been disabled"
}
### Validation Error
400 Bad Request
{
    "success": false,
    "message": "Email is required"
}
## Database Tables Used
admin_user
change_log
## Business Logic
Validate email and password.
Check whether the account exists.
Verify password using bcrypt.
Verify account status.
Generate JWT Access Token.
Update last_login.
Insert login event into ChangeLog.
Return administrator profile and token.


## 2. Logout API
## Endpoint
POST /api/v1/auth/logout

## Description
Terminates the current administrator session.

## Authentication
Bearer Token Required

## Headers
Authorization: Bearer <JWT_TOKEN>
## Request Body
{}
## Success Response
200 OK
{
    "success": true,
    "message": "Logged out successfully"
}
## Error Response
401 Unauthorized
{
    "success": false,
    "message": "Invalid token"
}
## Database Tables Used
admin_user
change_log
## Business Logic
Validate JWT.
Invalidate refresh/session token (if implemented).
Record logout in ChangeLog.

## 3. Get Profile API
## Endpoint
GET /api/v1/auth/profile

## Description
Returns the profile information of the currently authenticated administrator.

## Authentication
Bearer Token Required

## Headers
Authorization: Bearer <JWT_TOKEN>
## Success Response
200 OK
{
  "success": true,
  "data": {
    "id": "7c0c15b7-f9d0-48f6-8a9e-0f3a6d8c5d71",
    "employeeId": "PECADM001",
    "name": "Dr. Anjali Sharma",
    "email": "admin@pec.edu.in",
    "role": "SUPER_ADMIN",
    "phone": "9876543210",
    "lastLogin": "2026-07-15T08:45:21Z"
  }
}
## Error Response
401 Unauthorized
{
    "success": false,
    "message": "Authentication required"
}
## Database Tables Used
admin_user
Business Logic
Validate JWT.
Fetch administrator details.
Return profile information.

## 4. Refresh Token API
## Endpoint
POST /api/v1/auth/refresh-token

## Description
Generates a new JWT access token using a valid refresh token.

## Authentication
Refresh Token Required

## Request Body
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
## Success Response
200 OK
{
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
}
## Error Response
401 Unauthorized
{
    "success": false,
    "message": "Refresh token expired"
}
## Database Tables Used
admin_user
Business Logic
Validate refresh token.
Verify administrator.
Generate new JWT.
Return new access token.

## Authentication Flow
Admin
   │
   ▼
Login Request
   │
   ▼
Validate Credentials
   │
   ▼
Generate JWT
   │
   ▼
Return Access Token
   │
   ▼
Use Token for Protected APIs
   │
   ▼
Logout / Refresh Token

## Security Features
JWT-based authentication.
Passwords hashed using bcrypt.
Role-Based Access Control (RBAC).
HTTPS-only communication.
Input validation and sanitization.
Login/logout audit entries stored in ChangeLog.
Token expiration support.
Disabled account protection.

# 2. Student Module
## Module Overview

The Student module manages all student-related operations within the FaceGate system.

It allows administrators to create, retrieve, update, delete, and search student records. Student information is linked to batches, attendance records, face embeddings, and reports.

All Student APIs require administrator authentication.

## 1. Create Student
## Endpoint
POST /api/v1/students

## Description
Registers a new student in the FaceGate system.

## Authentication
Bearer Token Required

## Headers
Header	Value
Authorization	Bearer <JWT_TOKEN>
Content-Type	application/json
## Request Body
{
  "rollNumber": "23103001",
  "registrationNumber": "PEC20240001",
  "fullName": "Rahul Sharma",
  "email": "rahul@pec.edu.in",
  "phone": "9876543210",
  "batchId": "7bbd52d8-f8d7-4d4e-a8af-f5c9fcbf1144",
  "gender": "Male"
}
## Validation Rules
Field	Validation
rollNumber	Required, Unique
registrationNumber	Required, Unique
fullName	Required
email	Valid Email
batchId	Must Exist
phone	Optional
## Success Response
201 Created
{
  "success": true,
  "message": "Student created successfully.",
  "data": {
    "studentId": "9bc18df2-84fd-45a4-b58c-d239d4bc6320"
  }
}
## Error Response
409 Conflict
{
  "success": false,
  "message": "Student already exists."
}
## Database Tables Used
student

batch

change_log
## Business Logic
Validate input.
Verify batch exists.
Ensure roll number is unique.
Insert student.
Log action in ChangeLog.

## 2. Get All Students
## Endpoint
GET /api/v1/students

## Description
Returns a paginated list of students.

## Authentication
Bearer Token Required
Query Parameters
Parameter	Required	Description
page	No	Page Number
limit	No	Records per page
batchId	No	Filter by Batch
search	No	Search by Name or Roll Number
Example
GET /api/v1/students?page=1&limit=20
## Success Response
200 OK
{
  "success": true,
  "total": 245,
  "page": 1,
  "students": [
    {
      "id": "...",
      "rollNumber": "23103001",
      "name": "Rahul Sharma",
      "batch": "CSE-2024-A"
    }
  ]
}
## Database Tables Used
student
batch

## 3. Get Student By ID
## Endpoint
GET /api/v1/students/{studentId}
## Description
Returns detailed information of a student.

## Success Response
{
  "success": true,
  "data": {
    "id": "...",
    "rollNumber": "23103001",
    "registrationNumber": "PEC20240001",
    "fullName": "Rahul Sharma",
    "email": "rahul@pec.edu.in",
    "phone": "9876543210",
    "batch": {
      "id": "...",
      "batchCode": "CSE-2024-A"
    }
  }
}
## Database Tables Used
student
batch

## 4. Update Student
## Endpoint
PUT /api/v1/students/{studentId}

## Description
Updates student information.

## Request Body
{
  "phone": "9999999999",
  "email": "rahul.sharma@pec.edu.in"
}
## Success Response
200 OK
{
  "success": true,
  "message": "Student updated successfully."
}
## Database Tables Used
student
change_log

## Business Logic
Validate student exists.
Update fields.
Store old/new values in ChangeLog.

## 5. Delete Student
## Endpoint
DELETE /api/v1/students/{studentId}

## Description
Soft deletes a student.

## Success Response
200 OK
{
  "success": true,
  "message": "Student deleted successfully."
}
## Business Logic
Instead of permanently deleting the student:
is_active = false
This preserves attendance history.

## Database Tables Used
student
change_log

## 6. Get Students By Batch
## Endpoint
GET /api/v1/students/batch/{batchId}

## Description
Returns all students belonging to a particular batch.

## Success Response
{
  "success": true,
  "students": [
    {
      "id": "...",
      "rollNumber": "23103001",
      "fullName": "Rahul Sharma"
    }
  ]
}
## Database Tables Used
student
batch

# 3.Face Embedding Module
## Module Overview

The Face Embedding module manages facial biometric data for students.

Instead of storing face images directly, the system stores face embeddings (feature vectors generated by the face recognition model). These embeddings are used for offline face recognition on Android devices and synchronization with the backend.

Corrected 2026-07-10: there is no administrator authentication anywhere in this build (see
architecture doc Section 9 — deliberately deferred, not implemented yet). The only auth
that exists is the device token (`x-api-key`) used by paired devices for sync/heartbeat
calls. Treat every non-device-auth endpoint below as open until admin login ships.

## 1. Register Face Embedding
## Endpoint
POST /api/v1/face-embeddings

## Description
Registers a student's face embedding after successful face enrollment.

## Authentication
Bearer Token Required

## Headers
Header	Value
Authorization	Bearer <JWT_TOKEN>
Content-Type	application/json
## Request Body
{
  "studentId": "9bc18df2-84fd-45a4-b58c-d239d4bc6320",
  "deviceId": "6f3d8b0c-fc2f-4b1e-a8d7-1a84d5d8b6b3",
  "embedding": [
      0.123,
      -0.582,
      ...
  ],
  "modelVersion": "SCRFD-500M-v1"
}
## Validation Rules
Field	Validation
studentId	Required
deviceId	Required
embedding	Required
modelVersion	Required
## Success Response
201 Created
{
    "success": true,
    "message": "Face embedding registered successfully."
}
## Error Response
409 Conflict
{
    "success": false,
    "message": "Face already enrolled."
}
## Database Tables Used
student
face_embedding
device
change_log

## Business Logic
Verify student exists.
Verify device is registered.
Check if face already exists.
Store embedding.
Log operation.

## 2. Get Face Embedding
## Endpoint
GET /api/v1/face-embeddings/{studentId}
## Description
Returns the face embedding metadata of a student.
Note: Raw embeddings should only be returned to authorized systems or during synchronization.

## Success Response
{
    "success": true,
    "data": {
        "studentId": "...",
        "modelVersion": "SCRFD-500M-v1",
        "createdAt": "2026-07-15T10:00:00Z"
    }
}
## Database Tables Used
face_embedding
student

## 3. Update Face Embedding
## Endpoint
PUT /api/v1/face-embeddings/{studentId}
## Description
Updates the stored face embedding when a student's face is re-enrolled.

## Request Body
{
    "embedding": [
        0.234,
        -0.672,
        ...
    ],
    "modelVersion": "SCRFD-500M-v2"
}
## Success Response
200 OK
{
    "success": true,
    "message": "Face embedding updated successfully."
}
## Database Tables Used
face_embedding
change_log

## Business Logic
Verify student exists.
Replace existing embedding.
Record update in ChangeLog.

## 4. Delete Face Embedding
## Endpoint
DELETE /api/v1/face-embeddings/{studentId}
## Description
Deletes a student's stored face embedding.

## Success Response
200 OK
{
    "success": true,
    "message": "Face embedding deleted successfully."
}
## Database Tables Used
face_embedding
change_log

## Business Logic
Verify student exists.
Delete or deactivate embedding.
Record deletion in ChangeLog.

## 5. Check Enrollment Status
## Endpoint
GET /api/v1/face-embeddings/{studentId}/status
## Description
Checks whether a student has completed face enrollment.

## Success Response
{
    "success": true,
    "data": {
        "studentId": "...",
        "enrolled": true,
        "modelVersion": "SCRFD-500M-v1"
    }
}
## Database Tables Used
face_embedding

## 6. Download Face Embeddings (Device Sync)
## Endpoint
GET /api/v1/face-embeddings/sync
## Description
Returns all face embeddings required by a registered Android device for offline attendance.

## Authentication
Device Token Required

## Query Parameters
Parameter	Description
batchId	Download embeddings for a specific batch
lastSync	Return only updated embeddings
Example
GET /api/v1/face-embeddings/sync?batchId=123&lastSync=2026-07-15T09:00:00Z
## Success Response
{
    "success": true,
    "count": 72,
    "embeddings": [
        {
            "studentId": "...",
            "embedding": [0.123, -0.456, ...],
            "modelVersion": "SCRFD-500M-v1"
        }
    ]
}
## Database Tables Used
student
face_embedding
batch
device

# 4.Device Module
## Module Overview

The Device module manages Android attendance devices registered with the FaceGate system.

It provides APIs for device pairing, status monitoring, heartbeat communication, synchronization, and device management.

Only paired and active devices are allowed to synchronize attendance data with the backend.

**Corrected 2026-07-10** — this module previously documented a single admin-JWT-protected
`POST /api/v1/devices` that both created the device row and hands back a `device_token` in
the same call, with a human-typed `deviceId` like `"FG-ROOM101-TAB01"`. That was never how
the backend worked: the implementation shipped as self-service registration with no auth
at all, meaning anyone who knew (or guessed) a `room_id` could mint themselves a valid
device credential. This section now documents the fixed, two-step, pairing-code flow —
matching the original architecture doc's intent — and the admin-JWT references below are
removed because **no admin login exists anywhere in this build** (see Section 9 of the
architecture doc — that's a deliberate, documented decision, not an oversight limited to
this endpoint).

## 1. Create Device (admin, website)
## Endpoint
POST /api/v1/devices
## Description
Creates a device record for a room and returns a one-time, 6-digit pairing code (valid 15
minutes). This is an admin action performed on the website, *before* the physical tablet is
touched — it does not return a device_token, because no physical device is involved yet.

## Authentication
None. (No admin login exists in this build — see architecture doc Section 9. This is
unchanged from the rest of the website, not a gap specific to this endpoint.)

## Request Body
{
    "room_id":"6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1",
    "device_name":"Front Door Tablet"
}
## Success Response
201 Created
{
    "success":true,
    "message":"Device created — share the pairing code with whoever is setting up the tablet. It expires in 15 minutes.",
    "data":{
        "deviceId":"3fa2...",
        "roomId":"6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1",
        "deviceName":"Front Door Tablet",
        "pairingCode":"482913",
        "pairingCodeExpiresAt":"2026-07-10T11:05:00Z"
    }
}
## Error Responses
400 Bad Request — room_id/device_name missing, or the room already has an active or
pending device assigned to it (one-active-device-per-room, enforced both in application
code and as a DB constraint — see architecture doc Section 9).
## Database Tables Used
device
room
## Business Logic
Verify room exists (FK constraint).
Reject if the room already has an ACTIVE or PENDING_PAIRING device.
Generate a random 6-digit pairing_code + 15-minute expiry.
Insert device row with device_status = PENDING_PAIRING, no device_token yet.

## 2. Pair Device (physical device, first app launch)
## Endpoint
POST /api/v1/devices/pair
## Description
Exchanges a still-valid pairing code for the device's permanent device_id + device_token.
This is the only call in the whole system that hands out a device_token, and it's the last
step of pairing — after this, the device stores the token locally and sends it as
`x-api-key` on every subsequent request.

## Authentication
None (this call is how a device *obtains* its credential — nothing to authenticate yet).

## Request Body
{
    "pairing_code":"482913",
    "device_identifier":"Samsung-SM-T510-a1b2c3d4",
    "app_version":"1.0.0",
    "operating_system":"Android 14"
}
## Success Response
200 OK
{
    "success":true,
    "message":"Device paired successfully",
    "data":{
        "deviceId":"3fa2...",
        "deviceToken":"9e7c...",
        "roomId":"6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1"
    }
}
## Error Responses
400 Bad Request — pairing code missing, unknown, expired, or already redeemed.
## Database Tables Used
device
## Business Logic
Look up a PENDING_PAIRING device by pairing_code where pairing_code_expires_at is still in
the future.
Generate device_token, store device_identifier/app_version/operating_system, flip
device_status to ACTIVE, clear pairing_code (single-use).

## 3. Get All Devices
## Endpoint
GET /api/v1/devices
## Description
Returns all registered devices (including ones still PENDING_PAIRING, with their pairing
code, so an admin can retrieve/re-share it without regenerating).

## Authentication
None (no admin login exists in this build).

## Success Response
{
    "success":true,
    "data":[
        {
            "device_id":"3fa2...",
            "device_identifier":"Samsung-SM-T510-a1b2c3d4",
            "device_name":"Front Door Tablet",
            "device_status":"ACTIVE",
            "network_status":"ONLINE",
            "room_number":"Room-101",
            "pairing_code":null,
            "last_sync":"2026-07-10T10:45:00Z"
        }
    ]
}
## Database Tables Used
device
room

## 4. Get Device Details
## Endpoint
GET /api/v1/devices/{deviceId}
## Description
Returns detailed information about one device. Never includes device_token — only the
pairing exchange (§2) ever returns that — so this endpoint is safe to leave open.

## Success Response
{
    "success":true,
    "data":{
        "device_id":"3fa2...",
        "device_name":"Front Door Tablet",
        "room_number":"Room-101",
        "device_status":"ACTIVE",
        "battery_percentage":82,
        "last_heartbeat":"2026-07-10T10:50:00Z",
        "last_sync":"2026-07-10T10:45:00Z"
    }
}
## Database Tables Used
device
room

## 5. Update Device
## Endpoint
PUT /api/v1/devices/{deviceId}
## Description
Updates device information, including room reassignment (architecture doc Section 2 —
"reassignment doesn't require re-pairing"). Reassigning to a room that already has an
active/pending device is rejected, same guard as device creation.

## Request Body
{
    "device_name":"Computer Lab Tablet",
    "room_id":"..."
}
## Success Response
200 OK
{
    "success":true,
    "message":"Device updated successfully.",
    "data": { }
}
## Error Responses
400 Bad Request — target room already has an active or pending device.
## Database Tables Used
device

## 6. Deactivate Device
## Endpoint
DELETE /api/v1/devices/{deviceId}
## Description
Marks a device as inactive (soft delete — frees up its room for a new device).

## Success Response
{
    "success":true,
    "message":"Device deactivated successfully."
}
## Business Logic
Device is not deleted. Sets is_active = false, device_status = INACTIVE.
## Database Tables Used
device

## 7. Device Heartbeat
## Endpoint
POST /api/v1/devices/heartbeat

## Description
Android device periodically informs the server that it is online.

## Authentication
Device Token Required (`x-api-key` header — see architecture doc Section 4; NOT
`Authorization: Bearer`, despite what this doc previously implied).

## Request Body
{
    "battery_level":78,
    "storage_available_mb":18234,
    "network_status":"ONLINE"
}
## Success Response
{
    "success":true,
    "message":"Heartbeat received",
    "data": { }
}
## Database Tables Used
device
## Business Logic
The authenticated device's identity comes from its x-api-key, not from a deviceId in the
request body — a request body deviceId is never trusted, since that would let one device
spoof another's heartbeat.
Updates last_heartbeat, battery_percentage, storage_available_mb, network_status.

## Not implemented
`GET /api/v1/devices/{deviceId}/health` and `GET /api/v1/devices/{deviceId}/sync-history`
were documented in an earlier version of this contract but have no corresponding
route/controller in the backend. Removing them from the summary table below until they're
actually built, rather than leaving a promise nothing serves.

## Device API Summary
Method	Endpoint	Description
POST	/api/v1/devices	Create Device (admin) → pairing code
POST	/api/v1/devices/pair	Pair Device (device) → device_id + device_token
GET	/api/v1/devices	Get All Devices
GET	/api/v1/devices/{deviceId}	Device Details
PUT	/api/v1/devices/{deviceId}	Update Device
DELETE	/api/v1/devices/{deviceId}	Deactivate Device
POST	/api/v1/devices/heartbeat	Device Heartbeat
Security
Device creation and pairing have no admin gate beyond the pairing code itself — there is no
admin login in this build (architecture doc Section 9, a deliberate decision, not scoped
to fix here). The pairing code is the only thing standing between "knows the code" and "has
a valid device_token" — treat it like a one-time password: share it out of band (in person,
not over an open channel) and expect it to expire unused if nobody pairs within 15 minutes.
Every Android device receives a unique Device Token only once pairing completes.
Only ACTIVE devices can synchronize attendance (deviceAuth middleware checks this).
A room can have at most one ACTIVE (or PENDING_PAIRING) device at a time — enforced by a
partial unique index on (room_id) plus an application-level check with a friendly error
message, per architecture doc Section 9.

## Device Workflow
Admin (website)
   │
   ▼
Create Device (pick room, name) → gets 6-digit pairing code
   │
   ▼
Code handed to installer, typed into app
   │
   ▼
App calls POST /devices/pair → receives device_id + device_token
   │
   ▼
Heartbeat Every Few Minutes (x-api-key)
   │
   ▼
Sync Attendance (x-api-key)
   │
   ▼
Dashboard Displays Live Status


# 5.Timetable Module
## Module Overview

The Timetable module manages the academic schedule for all batches. It allows administrators to create, update, retrieve, and delete timetable entries while ensuring there are no scheduling conflicts between faculty, rooms, or batches.

Attendance Sessions are automatically generated based on the Timetable and Academic Calendar.

## 1. Create Timetable Entry
## Endpoint
POST /api/v1/timetables
## Description
Creates a new timetable entry for a batch.

## Authentication
Bearer Token Required (Admin Only)

## Headers
Header	Value
## Authorization	Bearer <JWT_TOKEN>
Content-Type	application/json
## Request Body
{
  "departmentId": "8a3b2e41-c8b4-4c18-ae9d-7c2f1c8f64a1",
  "batchId": "b2a7d8d3-8f3a-4d6a-b9b4-c62d83b73f11",
  "subjectId": "a1d3c5b8-9f7d-42d3-8b1f-5a7e8c6d9b20",
  "facultyId": "5f91f0d3-7c32-4d3a-a8d1-6b5d8d27e3f1",
  "roomId": "6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1",
  "dayOfWeek": "Monday",
  "periodNumber": 2,
  "startTime": "10:00",
  "endTime": "11:00",
  "semester": 5,
  "academicYear": "2026-27",
  "attendanceWindow": 10
}
## Validation Rules
Field	Validation
departmentId	Must exist
batchId	Must exist
facultyId	Must exist
subjectId	Must exist
roomId	Must exist
endTime	Greater than startTime
dayOfWeek	Monday–Sunday
## Success Response
201 Created
{
  "success": true,
  "message": "Timetable entry created successfully.",
  "data": {
    "timetableId": "87d2f1b5-a56c-4d72-bf0d-2f3a98e13d41"
  }
}
## Error Responses
### Faculty Conflict
409 Conflict
{
  "success": false,
  "message": "Faculty already has a class scheduled during this time."
}
### Room Conflict
{
  "success": false,
  "message": "Room is already occupied during this time."
}
### Batch Conflict
{
  "success": false,
  "message": "Batch already has another lecture during this time."
}
## Database Tables Used
timetable
department
batch
faculty
subject
room
change_log

## Business Logic
Validate all foreign keys.
Check faculty availability.
Check room availability.
Check batch schedule.
Create timetable entry.
Log action in ChangeLog.

## 2. Get All Timetable Entries
## Endpoint
GET /api/v1/timetables
## Description
Returns a paginated list of timetable entries.

## Query Parameters
Parameter	Description
page	Page number
limit	Records per page
batchId	Filter by batch
facultyId	Filter by faculty
roomId	Filter by room
semester	Filter by semester
## Success Response
{
  "success": true,
  "page": 1,
  "total": 180,
  "data": [
    {
      "id": "...",
      "dayOfWeek": "Monday",
      "subject": "Data Structures",
      "faculty": "Dr. Sharma",
      "room": "LH101"
    }
  ]
}
## Database Tables Used
timetable
faculty
subject
batch
room

## 3. Get Timetable by ID
## Endpoint
GET /api/v1/timetables/{timetableId}
## Description
Returns details of a specific timetable entry.

## Success Response
{
  "success": true,
  "data": {
    "id": "...",
    "department": "CSE",
    "batch": "CSE-2024-A",
    "faculty": "Dr. Sharma",
    "subject": "Data Structures",
    "room": "LH101",
    "dayOfWeek": "Monday",
    "startTime": "10:00",
    "endTime": "11:00"
  }
}
## Database Tables Used
timetable
department
batch
faculty
subject
room

## 4. Update Timetable
## Endpoint
PUT /api/v1/timetables/{timetableId}
## Description
Updates an existing timetable entry.

## Request Body
{
  "roomId": "...",
  "facultyId": "...",
  "startTime": "11:00",
  "endTime": "12:00"
}
## Success Response
200 OK
{
  "success": true,
  "message": "Timetable updated successfully."
}
## Business Logic
Revalidate all scheduling conflicts.
Update timetable.
Record old and new values in ChangeLog.
## Database Tables Used
timetable
change_log

## 5. Delete Timetable Entry
## Endpoint
DELETE /api/v1/timetables/{timetableId}
## Description
Soft deletes a timetable entry.

## Success Response
{
  "success": true,
  "message": "Timetable entry deleted successfully."
}
## Business Logic
Set is_active = false.
Preserve historical attendance sessions.
Log deletion.
## Database Tables Used
timetable
change_log

## 6. Get Timetable by Batch
## Endpoint
GET /api/v1/timetables/batch/{batchId}
## Description
Returns the complete timetable for a batch.

## Success Response
{
  "success": true,
  "batch": "CSE-2024-A",
  "timetable": [
    {
      "day": "Monday",
      "subject": "Data Structures",
      "time": "10:00 - 11:00",
      "room": "LH101"
    }
  ]
}
## Database Tables Used
timetable
batch
subject
faculty
room

## 7. Get Timetable by Faculty
## Endpoint
GET /api/v1/timetables/faculty/{facultyId}
## Description
Returns the teaching schedule of a faculty member.

## Success Response
{
  "success": true,
  "faculty": "Dr. Sharma",
  "schedule": [
    {
      "day": "Monday",
      "batch": "CSE-2024-A",
      "subject": "Data Structures",
      "time": "10:00 - 11:00"
    }
  ]
}
## Database Tables Used
timetable
faculty
batch
subject

## Timetable API Summary
Method	Endpoint	Description
POST	/api/v1/timetables	Create Timetable Entry
GET	/api/v1/timetables	Get All Timetable Entries
GET	/api/v1/timetables/{id}	Get Timetable Details
PUT	/api/v1/timetables/{id}	Update Timetable
DELETE	/api/v1/timetables/{id}	Soft Delete Timetable
GET	/api/v1/timetables/batch/{batchId}	Batch Timetable
GET	/api/v1/timetables/faculty/{facultyId}	Faculty Timetable
Security
Only administrators can create, update, or delete timetable entries.
Every timetable modification is recorded in the ChangeLog.
Conflict validation prevents overlapping schedules for rooms, faculty, and batches.
Only active timetable entries are synchronized to Android devices.

## Timetable Workflow
Admin
   │
   ▼
Create Timetable
   │
   ▼
Validate Batch
   │
   ▼
Validate Faculty
   │
   ▼
Validate Room
   │
   ▼
Check Scheduling Conflicts
   │
   ▼
Save Timetable
   │
   ▼
Generate Future Attendance Sessions
   │
   ▼
Synchronize to Android Devices

# 6. Attendance Session Module
## Module Overview

The Attendance Session module manages the lifecycle of attendance sessions. Sessions are generated automatically from the timetable based on the academic calendar or manually created by authorized administrators. The module allows starting, ending, viewing, and managing attendance sessions.

## 1. Generate Attendance Session
## Endpoint
POST /api/v1/attendance-sessions
## Description
Creates an attendance session from a timetable entry for a specific date.

## Authentication
Bearer Token Required (Admin Only)

## Headers
Header	Value
## Authorization	Bearer <JWT_TOKEN>
Content-Type	application/json
## Request Body
{
    "timetableId":"87d2f1b5-a56c-4d72-bf0d-2f3a98e13d41",
    "calendarId":"c12e5a91-8b34-4f0e-9d61-5d6f87d3b2c8",
    "sessionDate":"2026-07-15"
}
## Validation Rules
Field	Validation
timetableId	Must exist
calendarId	Must exist
sessionDate	Must be a working day
## Success Response
201 Created
{
    "success": true,
    "message": "Attendance session generated successfully.",
    "data": {
        "attendanceSessionId":"d83b1c9d-7e54-4b8b-98b4-4c8d3e91f123"
    }
}
## Error Response
409 Conflict
{
    "success": false,
    "message":"Attendance session already exists."
}
## Database Tables Used
attendance_session
timetable
academic_calendar
change_log

## Business Logic
Verify timetable exists.
Verify academic calendar entry.
Ensure attendance session doesn't already exist.
Create attendance session.
Record operation in ChangeLog.

## 2. Get All Attendance Sessions
## Endpoint
GET /api/v1/attendance-sessions
## Description
Returns all attendance sessions with optional filters.

## Query Parameters
Parameter	Description
page	Page number
limit	Records per page
date	Session date
batchId	Batch
facultyId	Faculty
status	ACTIVE, COMPLETED
## Success Response
{
  "success": true,
  "page": 1,
  "total": 32,
  "data": [
    {
      "sessionId":"...",
      "subject":"Data Structures",
      "faculty":"Dr. Sharma",
      "status":"ACTIVE"
    }
  ]
}
## Database Tables Used
attendance_session
timetable

## 3. Get Attendance Session Details
## Endpoint
GET /api/v1/attendance-sessions/{sessionId}
## Description
Returns complete details of a single attendance session.

## Success Response
{
    "success":true,
    "data":{
        "sessionId":"...",
        "date":"2026-07-15",
        "subject":"Data Structures",
        "faculty":"Dr. Sharma",
        "room":"LH101",
        "attendanceWindow":10,
        "status":"ACTIVE"
    }
}
## Database Tables Used
attendance_session
timetable
subject
faculty
room

## 4. Start Attendance Session
## Endpoint
POST /api/v1/attendance-sessions/{sessionId}/start
## Description
Starts an attendance session and makes it available for attendance marking.

## Success Response
200 OK
{
    "success":true,
    "message":"Attendance session started successfully."
}
## Business Logic
Change status to ACTIVE.
Open attendance window.
Notify registered Android devices.
## Database Tables Used
attendance_session
notification
change_log

## 5. End Attendance Session
## Endpoint
POST /api/v1/attendance-sessions/{sessionId}/end
## Description
Ends the attendance session and prevents further attendance submissions.

## Success Response
{
    "success":true,
    "message":"Attendance session completed successfully."
}
## Business Logic
Close attendance window.
Calculate attendance summary.
Update session statistics.
Notify dashboard.
## Database Tables Used
attendance_session
attendance
notification
change_log

## 6. Update Attendance Session
## Endpoint
PUT /api/v1/attendance-sessions/{sessionId}
## Description
Updates an attendance session before it is completed.

## Request Body
{
    "attendanceWindow":15,
    "status":"ACTIVE"
}
## Success Response
200 OK
{
    "success":true,
    "message":"Attendance session updated successfully."
}
## Database Tables Used
attendance_session
change_log

## Business Logic
Only ACTIVE sessions can be updated.
COMPLETED sessions are read-only.

## 7. Cancel Attendance Session
## Endpoint
DELETE /api/v1/attendance-sessions/{sessionId}
## Description
Cancels an attendance session.

## Success Response
{
    "success":true,
    "message":"Attendance session cancelled successfully."
}
## Business Logic
Set session status to CANCELLED.
Existing attendance records remain for audit unless explicitly removed by an administrator.
Record the action in ChangeLog.
## Database Tables Used
attendance_session
change_log

## 8. Get Live Attendance Session
## Endpoint
GET /api/v1/attendance-sessions/live
## Description
Returns the currently active attendance session.
This API powers the Live Dashboard.

## Success Response
{
  "success": true,
  "data": {
    "sessionId":"...",
    "subject":"Data Structures",
    "faculty":"Dr. Sharma",
    "batch":"CSE-2024-A",
    "room":"LH101",
    "present":58,
    "totalStudents":72,
    "status":"ACTIVE"
  }
}
## Database Tables Used
attendance_session
attendance
timetable

## Attendance Session API Summary
Method	Endpoint	Description
POST	/api/v1/attendance-sessions	Generate Attendance Session
GET	/api/v1/attendance-sessions	Get All Sessions
GET	/api/v1/attendance-sessions/{id}	Get Session Details
POST	/api/v1/attendance-sessions/{id}/start	Start Session
POST	/api/v1/attendance-sessions/{id}/end	End Session
PUT	/api/v1/attendance-sessions/{id}	Update Session
DELETE	/api/v1/attendance-sessions/{id}	Cancel Session
GET	/api/v1/attendance-sessions/live	Get Live Session
Security
Only administrators can create, update, start, end, or cancel sessions.
Attendance can only be marked while the session status is ACTIVE.
Completed sessions are read-only.
Every action is recorded in the ChangeLog.
Devices synchronize only active sessions assigned to them.

## Attendance Session Workflow
Admin
   │
   ▼
Generate Attendance Session
   │
   ▼
Validate Timetable
   │
   ▼
Validate Academic Calendar
   │
   ▼
Create Session
   │
   ▼
Start Session
   │
   ▼
Android Devices Download Session
   │
   ▼
Students Mark Attendance
   │
   ▼
End Session
   │
   ▼
Generate Attendance Summary
   │
   ▼
Dashboard Updated

# 7.Attendance Module
## Module Overview

The Attendance module manages all attendance-related operations within the FaceGate system.

It enables Android devices and administrators to mark attendance, upload offline attendance records, retrieve attendance history, perform manual attendance corrections, and generate attendance summaries.

Every attendance record belongs to an Attendance Session.

## 1. Mark Attendance (Face Recognition)
## Endpoint
POST /api/v1/attendance/mark
## Description
Marks attendance for a student using Face Recognition.

## Authentication
Device Token Required (`x-api-key`). **Corrected 2026-07-10** — this was always documented
as device-token protected, but the route had no `deviceAuth` middleware applied; any caller
with network access could write attendance for any student/session with no credential.
Fixed by adding `deviceAuth` to `POST /mark`.

## Headers
Header	Value
## Authorization	Device Token
Content-Type	application/json
## Request Body
{
    "attendanceSessionId":"d83b1c9d-7e54-4b8b-98b4-4c8d3e91f123",
    "studentId":"9bc18df2-84fd-45a4-b58c-d239d4bc6320",
    "deviceId":"6f3d8b0c-fc2f-4b1e-a8d7-1a84d5d8b6b3",
    "recognitionConfidence":98.75,
    "attendanceTime":"2026-07-15T10:05:12Z"
}
## Validation Rules
Field	Validation
attendanceSessionId	Must exist
studentId	Must exist
deviceId	Must exist
recognitionConfidence	0–100
## Success Response
201 Created
{
    "success":true,
    "message":"Attendance marked successfully."
}
## Error Responses
### Duplicate Attendance
409 Conflict
{
    "success":false,
    "message":"Attendance already marked."
}
### Session Closed
{
    "success":false,
    "message":"Attendance session has ended."
}
### Database Tables Used
attendance
attendance_session
student
device
conflict
change_log

## Business Logic
Verify attendance session is ACTIVE.
Verify student exists.
Verify attendance not already marked.
Validate confidence threshold.
Save attendance.
Update attendance statistics.
Generate Conflict if required.

## 2. Manual Attendance
**Not implemented** — documented here but there's no matching route in `attendance.ts`
(noticed while fixing the auth gap on §1; out of scope for the pairing fix, flagging so
it isn't mistaken for working). The website's manual-override feature (architecture doc
Section 5) currently has nowhere to call.
## Endpoint
POST /api/v1/attendance/manual
## Description
Allows administrators to manually mark or correct attendance.

## Authentication
Bearer Token Required (Admin)

## Request Body
{
    "attendanceSessionId":"...",
    "studentId":"...",
    "attendanceStatus":"PRESENT",
    "remarks":"Face recognition failed"
}
## Success Response
200 OK
{
    "success":true,
    "message":"Manual attendance recorded successfully."
}
## Database Tables Used
attendance
admin_user
change_log
conflict

## Business Logic
Verify admin permissions.
Update attendance.
Record manual override.
Create ChangeLog.

## 3. Get Attendance by Session
## Endpoint
GET /api/v1/attendance/session/{sessionId}
## Description
Returns all attendance records for a particular attendance session.

## Success Response
{
    "success":true,
    "attendance":[
        {
            "studentName":"Rahul Sharma",
            "status":"PRESENT",
            "time":"10:03 AM"
        }
    ]
}
## Database Tables Used
attendance
student
attendance_session

## 4. Get Student Attendance History
## Endpoint
GET /api/v1/attendance/student/{studentId}
## Description
Returns the attendance history of a student.

## Query Parameters
Parameter	Description
semester	Optional
subjectId	Optional
from	Optional
to	Optional
## Success Response
{
    "success":true,
    "attendancePercentage":92.6,
    "records":[
        {
            "subject":"Data Structures",
            "status":"PRESENT",
            "date":"2026-07-15"
        }
    ]
}
## Database Tables Used
attendance
attendance_session
student
subject

## 5. Update Attendance
## Endpoint
PUT /api/v1/attendance/{attendanceId}
## Description
Updates an attendance record.

## Authentication
Admin Only (in name — no admin login exists in this build, so this is unauthenticated in
practice; same caveat as everywhere else, see the note at the top of this document).

## Request Body
{
    "attendanceStatus":"ABSENT",
    "remarks":"Incorrect recognition"
}
## Success Response
200 OK
{
    "success":true,
    "message":"Attendance updated successfully."
}
## Database Tables Used
attendance
change_log
conflict

## Business Logic
Validate permissions.
Update attendance.
Record audit.
Generate Conflict if necessary.

## 6. Delete Attendance Record
## Endpoint
DELETE /api/v1/attendance/{attendanceId}
## Description
Deletes an attendance record (soft delete).

## Success Response
{
    "success":true,
    "message":"Attendance deleted successfully."
}
## Business Logic
Instead of deleting,
is_active = false

## Database Tables Used
attendance
change_log

## 7. Upload Offline Attendance
## Endpoint
POST /api/v1/sync/attendance
## Description
Uploads attendance records collected while the Android device was offline, in a batch.
**Corrected 2026-07-10** — this was documented at `/api/v1/attendance/sync`, which doesn't
exist; the real, working route is under the sync router (`/api/v1/sync/attendance`, see
Synchronization Module), which already had `deviceAuth` applied correctly.

## Authentication
Device Token Required

## Request Body
{
  "deviceId":"FG-ROOM101-TAB01",
  "attendance":[
      {
          "studentId":"...",
          "attendanceSessionId":"...",
          "time":"..."
      }
  ]
}
## Success Response
200 OK
{
    "success":true,
    "uploaded":65,
    "failed":1
}
## Database Tables Used
attendance
device
device_sync_log
conflict

## Business Logic
Validate device.
Check duplicate records.
Upload attendance.
Create DeviceSyncLog.
Generate conflicts if needed.

## 8. Attendance Summary
## Endpoint
GET /api/v1/attendance/session/{sessionId}/summary
## Description
Returns attendance statistics for one session.

## Success Response
{
    "success":true,
    "summary":{
        "totalStudents":72,
        "present":68,
        "absent":4,
        "attendancePercentage":94.4
    }
}
## Database Tables Used
attendance
attendance_session
## Attendance API Summary
Method	Endpoint	Description
POST	/api/v1/attendance	Mark Attendance
POST	/api/v1/attendance/manual	Manual Attendance
GET	/api/v1/attendance/session/{id}	Session Attendance
GET	/api/v1/attendance/student/{id}	Student Attendance History
PUT	/api/v1/attendance/{id}	Update Attendance
DELETE	/api/v1/attendance/{id}	Soft Delete Attendance
POST	/api/v1/attendance/sync	Upload Offline Attendance
GET	/api/v1/attendance/session/{id}/summary	Attendance Summary

## Security
Only registered devices can mark attendance.
Attendance can only be marked during an ACTIVE session.
Duplicate attendance is automatically rejected.
Manual attendance requires administrator privileges.
Every modification is recorded in the ChangeLog.
Synchronization events are recorded in DeviceSyncLog.
Suspicious activity generates entries in the Conflict table.

## Attendance Workflow
Android Device
      │
      ▼
Face Recognition
      │
      ▼
Match Student
      │
      ▼
Validate Session
      │
      ▼
Save Attendance
      │
      ▼
Update Session Statistics
      │
      ▼
Generate Conflict (if required)
      │
      ▼
Sync to Backend
      │
      ▼
Dashboard Updated

# 8.Dashboard Module
## Module Overview

The Dashboard module provides real-time and summarized information about the FaceGate system. It aggregates data from attendance sessions, devices, students, synchronization logs, conflicts, and notifications to present a live overview to administrators.

The Dashboard APIs are read-only and require administrator authentication.

## 1. Dashboard Overview
## Endpoint
GET /api/v1/dashboard/overview
## Description
Returns the overall statistics displayed on the dashboard homepage.

## Authentication
Bearer Token Required (Admin Only)

## Headers
Header	Value
Authorization	Bearer <JWT_TOKEN>
## Success Response
200 OK
{
  "success": true,
  "data": {
    "totalStudents": 1250,
    "totalFaculty": 68,
    "totalDepartments": 6,
    "totalRooms": 42,
    "activeDevices": 18,
    "offlineDevices": 2,
    "todayAttendanceSessions": 35,
    "activeSessions": 4,
    "todayAttendancePercentage": 93.8
  }
}
## Database Tables Used
student
faculty
department
room
device
attendance_session
attendance

## Business Logic
Count active students
Count faculty
Count departments
Count devices
Calculate today's attendance percentage
Return dashboard statistics

## 2. Live Attendance Dashboard
## Endpoint
GET /api/v1/dashboard/live-attendance
## Description
Returns all currently active attendance sessions with live attendance statistics.

## Success Response
{
  "success": true,
  "sessions": [
    {
      "sessionId": "...",
      "subject": "Data Structures",
      "faculty": "Dr. Sharma",
      "batch": "CSE-2024-A",
      "room": "LH101",
      "present": 58,
      "expected": 72,
      "percentage": 80.5,
      "status": "ACTIVE"
    }
  ]
}
## Database Tables Used
attendance_session
attendance
timetable
faculty
subject
batch
room

## 3. Device Monitoring
## Endpoint
GET /api/v1/dashboard/devices
## Description
Returns the live status of all registered Android devices.

## Success Response
{
  "success": true,
  "devices": [
    {
      "deviceId": "FG-ROOM101-TAB01",
      "room": "LH101",
      "status": "ONLINE",
      "battery": 84,
      "lastHeartbeat": "2026-07-15T11:15:00Z",
      "lastSync": "2026-07-15T11:10:00Z"
    }
  ]
}
## Database Tables Used
device
room
device_sync_log

## Business Logic
Show online/offline status
Display battery level
Display last heartbeat
Display last synchronization

## 4. Synchronization Status
## Endpoint
GET /api/v1/dashboard/synchronization
## Description
Displays synchronization health of all devices.

## Success Response
{
  "success": true,
  "summary": {
    "successfulSyncs": 24,
    "failedSyncs": 2,
    "pendingSyncs": 1
  }
}
## Database Tables Used
device_sync_log
device

## 5. Conflict Dashboard
## Endpoint
GET /api/v1/dashboard/conflicts
## Description
Returns unresolved attendance conflicts.

## Success Response
{
  "success": true,
  "pending": 5,
  "conflicts": [
    {
      "id": "...",
      "student": "Rahul Sharma",
      "type": "LOW_CONFIDENCE",
      "severity": "MEDIUM",
      "status": "PENDING"
    }
  ]
}
## Database Tables Used
conflict
attendance
student

## 6. Attendance Analytics
## Endpoint
GET /api/v1/dashboard/analytics
## Description
Returns summarized attendance analytics for visualization.

## Query Parameters
Parameter	Description
from	Start date
to	End date
## Success Response
{
  "success": true,
  "analytics": {
    "overallAttendance": 94.2,
    "averagePerDay": 91.8,
    "highestAttendanceDepartment": "CSE",
    "lowestAttendanceDepartment": "Mechanical"
  }
}
## Database Tables Used
attendance
attendance_session
department

## 7. Recent Activities
## Endpoint
GET /api/v1/dashboard/activity
## Description
Returns recent activities performed in the system.

## Success Response
{
  "success": true,
  "activities": [
    {
      "time": "11:10 AM",
      "action": "Attendance session started",
      "user": "Admin"
    },
    {
      "time": "11:05 AM",
      "action": "New device registered",
      "user": "Admin"
    }
  ]
}
## Database Tables Used
change_log

## 8. Dashboard Notifications
## Endpoint
GET /api/v1/dashboard/notifications
## Description
Returns unread notifications for the dashboard.

## Success Response
{
  "success": true,
  "notifications": [
    {
      "title": "Device Offline",
      "priority": "HIGH",
      "message": "Room 101 Tablet has not synchronized for 30 minutes."
    }
  ]
}
## Database Tables Used
notification

## Dashboard API Summary
Method	Endpoint	Description
GET	/api/v1/dashboard/overview	Dashboard Statistics
GET	/api/v1/dashboard/live-attendance	Live Attendance Sessions
GET	/api/v1/dashboard/devices	Device Monitoring
GET	/api/v1/dashboard/synchronization	Synchronization Status
GET	/api/v1/dashboard/conflicts	Pending Conflicts
GET	/api/v1/dashboard/analytics	Attendance Analytics
GET	/api/v1/dashboard/activity	Recent Activities
GET	/api/v1/dashboard/notifications	Dashboard Notifications

## Security
All Dashboard APIs require Administrator Authentication.
Access is controlled using Role-Based Access Control (RBAC).
Dashboard endpoints are read-only.
Sensitive information is filtered based on the administrator's role.
Dashboard refreshes periodically to provide near real-time updates.

## Dashboard Workflow
Admin Login
      │
      ▼
Dashboard Loaded
      │
      ▼
Overview Statistics
      │
      ├────────► Live Attendance
      ├────────► Device Status
      ├────────► Synchronization Status
      ├────────► Pending Conflicts
      ├────────► Notifications
      ├────────► Attendance Analytics
      └────────► Recent Activities

# 9.Reports Module
## Module Overview

The Reports module provides attendance reports and analytics for students, batches, faculty, departments, and subjects. It supports filtering by date, semester, batch, and subject, and allows exporting reports in PDF or Excel format.

All report APIs require administrator authentication.

## 1. Student Attendance Report
## Endpoint
GET /api/v1/reports/students/{studentId}
## Description
Returns the attendance report of a specific student.

## Authentication
Bearer Token Required (Admin Only)

## Query Parameters
Parameter	Required	Description
from	No	Start Date
to	No	End Date
semester	No	Semester
subjectId	No	Subject
Example
GET /api/v1/reports/students/9bc18df2?semester=5
## Success Response
{
  "success": true,
  "data": {
    "studentId": "9bc18df2",
    "studentName": "Rahul Sharma",
    "batch": "CSE-2024-A",
    "overallAttendance": 92.4,
    "subjects": [
      {
        "subject": "Data Structures",
        "present": 26,
        "total": 28,
        "percentage": 92.8
      }
    ]
  }
}
## Database Tables Used
attendance
attendance_session
student
subject

## Business Logic
Calculate attendance percentage.
Group attendance by subject.
Return attendance summary.

## 2. Batch Attendance Report
## Endpoint
GET /api/v1/reports/batches/{batchId}
## Description
Returns attendance statistics for an entire batch.

## Query Parameters
Parameter	Description
from	Start Date
to	End Date
subjectId	Subject
## Success Response
{
  "success": true,
  "batch": "CSE-2024-A",
  "overallAttendance": 91.2,
  "students": [
    {
      "student": "Rahul Sharma",
      "attendance": 92.4
    }
  ]
}
## Database Tables Used
batch
student
attendance

## 3. Faculty Attendance Report
## Endpoint
GET /api/v1/reports/faculties/{facultyId}
## Description
Returns attendance statistics for classes conducted by a faculty member.

## Success Response
{
  "success": true,
  "faculty": "Dr. Sharma",
  "classesConducted": 42,
  "averageAttendance": 89.3
}
## Database Tables Used
faculty
timetable
attendance_session
attendance

## 4. Subject Attendance Report
## Endpoint
GET /api/v1/reports/subjects/{subjectId}
## Description
Returns attendance statistics for a particular subject.

## Success Response
{
  "success": true,
  "subject": "Data Structures",
  "overallAttendance": 88.6
}
## Database Tables Used
subject
attendance
attendance_session

## 5. Daily Attendance Report
## Endpoint
GET /api/v1/reports/daily
## Description
Returns attendance statistics for a selected day.

## Query Parameters
Parameter	Description
date	Attendance Date
## Success Response
{
  "success": true,
  "date": "2026-07-15",
  "sessions": 34,
  "present": 2134,
  "absent": 118,
  "attendancePercentage": 94.7
}
## Database Tables Used
attendance
attendance_session

## 6. Monthly Attendance Report
## Endpoint
GET /api/v1/reports/monthly
## Description
Returns attendance statistics for an entire month.

## Query Parameters
Parameter	Description
month	Month
year	Year
## Success Response
{
  "success": true,
  "month": "July",
  "workingDays": 24,
  "overallAttendance": 93.2
}
## Database Tables Used
attendance
attendance_session
academic_calendar

## 7. Department Attendance Report
## Endpoint
GET /api/v1/reports/departments/{departmentId}
## Description
Returns attendance statistics for an academic department.

## Success Response
{
  "success": true,
  "department": "Computer Science",
  "overallAttendance": 94.1
}
## Database Tables Used
department
batch
attendance

## 8. Export Report
## Endpoint
GET /api/v1/reports/export
## Description
Exports attendance reports as PDF or Excel.

## Query Parameters
Parameter	Description
reportType	student, batch, faculty, subject, daily, monthly
format	pdf, excel
id	Entity ID (if applicable)
Example
GET /api/v1/reports/export?reportType=student&id=9bc18df2&format=pdf
## Success Response
{
  "success": true,
  "downloadUrl": "/downloads/student-report-9bc18df2.pdf"
}
## Database Tables Used
attendance
attendance_session
student
batch
faculty
subject

## Business Logic
Generate report.
Format report.
Store temporarily.
Return download link.

## Reports API Summary
Method	Endpoint	Description
GET	/api/v1/reports/students/{studentId}	Student Report
GET	/api/v1/reports/batches/{batchId}	Batch Report
GET	/api/v1/reports/faculties/{facultyId}	Faculty Report
GET	/api/v1/reports/subjects/{subjectId}	Subject Report
GET	/api/v1/reports/daily	Daily Report
GET	/api/v1/reports/monthly	Monthly Report
GET	/api/v1/reports/departments/{departmentId}	Department Report
GET	/api/v1/reports/export	Export Reports

## Security
Reports are accessible only to authenticated administrators.
Role-Based Access Control (RBAC) determines which reports a user can access.
Exported reports are generated on demand and should expire after a configurable time.
Report generation and downloads can be logged in the ChangeLog table for auditing.

## Report Generation Workflow
Admin Login
      │
      ▼
Select Report Type
      │
      ▼
Apply Filters
      │
      ▼
Retrieve Attendance Data
      │
      ▼
Calculate Statistics
      │
      ▼
Generate Report
      │
      ├────────► Display on Dashboard
      │
      └────────► Export as PDF / Excel

# 10. Conflict Module
## Module Overview

The Conflict module manages attendance anomalies detected by the FaceGate system. Conflicts are generated automatically during attendance processing and synchronization. Administrators can view, investigate, and resolve these conflicts through the web dashboard.

All Conflict APIs require administrator authentication.

## 1. Get All Conflicts
## Endpoint
GET /api/v1/conflicts
## Description
Returns a paginated list of attendance conflicts.

## Authentication
Bearer Token Required (Admin Only)

## Query Parameters
Parameter	Required	Description
page	No	Page number
limit	No	Records per page
severity	No	LOW, MEDIUM, HIGH, CRITICAL
status	No	PENDING, RESOLVED
type	No	Conflict type
sessionId	No	Attendance Session ID
Example
GET /api/v1/conflicts?status=PENDING&severity=HIGH
## Success Response
200 OK
{
  "success": true,
  "page": 1,
  "total": 12,
  "data": [
    {
      "id": "cf-001",
      "studentName": "Rahul Sharma",
      "conflictType": "LOW_CONFIDENCE",
      "severity": "MEDIUM",
      "status": "PENDING",
      "detectedAt": "2026-07-15T10:05:15Z"
    }
  ]
}
## Database Tables Used
conflict
attendance
student
attendance_session

## Business Logic
Retrieve conflicts based on filters.
Support pagination.
Sort by detection time (latest first).
## 2. Get Conflict Details
## Endpoint
GET /api/v1/conflicts/{conflictId}
## Description
Returns complete information about a specific conflict.

## Success Response
{
  "success": true,
  "data": {
    "id": "cf-001",
    "student": "Rahul Sharma",
    "attendanceSession": "Data Structures",
    "conflictType": "LOW_CONFIDENCE",
    "severity": "MEDIUM",
    "description": "Face recognition confidence below threshold.",
    "status": "PENDING",
    "detectedAt": "2026-07-15T10:05:15Z"
  }
}
## Database Tables Used
conflict
attendance
attendance_session
student

## 3. Resolve Conflict
## Endpoint
PUT /api/v1/conflicts/{conflictId}/resolve
## Description
Marks a conflict as resolved after administrator review.

## Authentication
Bearer Token Required (Admin Only)

## Request Body
{
  "resolutionNotes": "Attendance verified manually.",
  "actionTaken": "MARK_PRESENT"
}
## Success Response
200 OK
{
  "success": true,
  "message": "Conflict resolved successfully."
}
## Error Response
404 Not Found
{
  "success": false,
  "message": "Conflict not found."
}
## Database Tables Used
conflict
admin_user
change_log

## Business Logic
Verify administrator permissions.
Update conflict status to RESOLVED.
Save resolution notes.
Record administrator ID.
Add entry to ChangeLog.

## 4. Reopen Conflict
## Endpoint
PUT /api/v1/conflicts/{conflictId}/reopen
## Description
Reopens a previously resolved conflict.

## Success Response
{
  "success": true,
  "message": "Conflict reopened successfully."
}
## Database Tables Used
conflict
change_log

## Business Logic
Only SUPER_ADMIN may reopen conflicts.
Reset status to PENDING.
Record action in ChangeLog.

## 5. Get Pending Conflicts
## Endpoint
GET /api/v1/conflicts/pending
## Description
Returns all unresolved conflicts.

## Success Response
{
  "success": true,
  "pendingCount": 6,
  "conflicts": [
    {
      "student": "Rahul Sharma",
      "type": "LOW_CONFIDENCE",
      "severity": "MEDIUM"
    }
  ]
}
## Database Tables Used
conflict
## 6. Get Conflict Statistics
## Endpoint
GET /api/v1/conflicts/statistics
## Description
Returns conflict analytics for the dashboard.

## Success Response
{
  "success": true,
  "statistics": {
    "total": 45,
    "pending": 8,
    "resolved": 37,
    "highSeverity": 2,
    "lowConfidence": 20,
    "duplicateAttendance": 12
  }
}
## Database Tables Used
conflict
## 7. Delete Conflict
## Endpoint
DELETE /api/v1/conflicts/{conflictId}
## Description
Archives a conflict record.
Note: For audit purposes, conflicts should normally be archived (soft delete) rather than permanently removed.

## Success Response
{
  "success": true,
  "message": "Conflict archived successfully."
}
## Database Tables Used
conflict
change_log

## Business Logic
Mark conflict as archived.
Preserve audit history.
Record operation in ChangeLog.
## Conflict API Summary
Method	Endpoint	Description
GET	/api/v1/conflicts	Get All Conflicts
GET	/api/v1/conflicts/{id}	Get Conflict Details
PUT	/api/v1/conflicts/{id}/resolve	Resolve Conflict
PUT	/api/v1/conflicts/{id}/reopen	Reopen Conflict
GET	/api/v1/conflicts/pending	Get Pending Conflicts
GET	/api/v1/conflicts/statistics	Conflict Analytics
DELETE	/api/v1/conflicts/{id}	Archive Conflict

## Security
Only authenticated administrators can access Conflict APIs.
Only SUPER_ADMIN can reopen archived or resolved conflicts.
All conflict actions are recorded in the ChangeLog.
Conflict records are retained for audit purposes.

## Conflict Resolution Workflow
Attendance Recorded
        │
        ▼
Validation Engine
        │
        ▼
Conflict Detected
        │
        ▼
Conflict Table
        │
        ▼
Dashboard Alert
        │
        ▼
Administrator Reviews Conflict
        │
        ├────────► Resolve
        │
        ├────────► Manual Attendance Update
        │
        └────────► Reopen (if required)
        │
        ▼
Update ChangeLog

# 11.Notification Module
## Module Overview

The Notification module manages all system-generated and administrator-generated notifications in the FaceGate platform.

Notifications are used to alert administrators about important events, including attendance sessions, synchronization issues, conflicts, device status changes, holidays, and system announcements.

All Notification APIs require administrator authentication.

## 1. Get All Notifications
## Endpoint
GET /api/v1/notifications
## Description
Returns all notifications for the authenticated administrator.

## Authentication
Bearer Token Required (Admin Only)

## Headers
Header	Value
Authorization	Bearer <JWT_TOKEN>
## Query Parameters
Parameter	Required	Description
page	No	Page number
limit	No	Records per page
isRead	No	true / false
priority	No	LOW, MEDIUM, HIGH, CRITICAL
type	No	Notification category
Example
GET /api/v1/notifications?isRead=false
## Success Response
200 OK
{
  "success": true,
  "page": 1,
  "total": 24,
  "notifications": [
    {
      "id": "not-001",
      "title": "Device Offline",
      "message": "Room 101 Tablet has not synchronized for 30 minutes.",
      "priority": "HIGH",
      "type": "DEVICE",
      "isRead": false,
      "createdAt": "2026-07-15T11:20:00Z"
    }
  ]
}
## Database Tables Used
notification
admin_user

## Business Logic
Return notifications of logged-in administrator.
Sort newest first.
Support pagination.
## 2. Get Notification Details
## Endpoint
GET /api/v1/notifications/{notificationId}
## Description
Returns complete details of one notification.

## Success Response
{
  "success": true,
  "data": {
    "id": "not-001",
    "title": "Device Offline",
    "message": "Room 101 Tablet has not synchronized for 30 minutes.",
    "priority": "HIGH",
    "type": "DEVICE",
    "isRead": false,
    "createdAt": "2026-07-15T11:20:00Z"
  }
}
## Database Tables Used
notification
## 3. Create Notification
## Endpoint
POST /api/v1/notifications
## Description
Creates a new notification.
Used for announcements or manual administrator messages.

## Authentication
Bearer Token Required (Super Admin)

## Request Body
{
  "title":"Server Maintenance",
  "message":"The FaceGate server will undergo maintenance tonight at 10 PM.",
  "notificationType":"SYSTEM",
  "priority":"HIGH",
  "recipientId":"6b84fd91-a4c5-48d7-b1c2-8d43aefb4c10"
}
## Success Response
201 Created
{
  "success": true,
  "message": "Notification created successfully."
}
## Database Tables Used
notification
admin_user
change_log

## Business Logic
Validate recipient.
Store notification.
Record creation in ChangeLog.
## 4. Mark Notification as Read
## Endpoint
PUT /api/v1/notifications/{notificationId}/read
## Description
Marks a notification as read.

## Success Response
200 OK
{
  "success": true,
  "message": "Notification marked as read."
}
## Database Tables Used
notification
Business Logic
Update is_read = true.

## 5. Mark All Notifications as Read
## Endpoint
PUT /api/v1/notifications/read-all
## Description
Marks all unread notifications of the logged-in administrator as read.

## Success Response
{
  "success": true,
  "message": "All notifications marked as read."
}
## Database Tables Used
notification

## 6. Delete Notification
## Endpoint
DELETE /api/v1/notifications/{notificationId}
## Description
Archives a notification.

## Success Response
{
    "success": true,
    "message": "Notification archived successfully."
}
## Database Tables Used
notification
change_log

## Business Logic
Instead of deleting
is_active = false

## 7. Get Unread Notification Count
## Endpoint
GET /api/v1/notifications/unread-count
## Description
Returns unread notification count.

## Success Response
{
    "success": true,
    "count": 8
}
## Database Tables Used
notification

## 8. Broadcast Notification
## Endpoint
POST /api/v1/notifications/broadcast
## Description
Sends a notification to all administrators.

## Authentication
SUPER_ADMIN Only

## Request Body
{
    "title":"Holiday Announcement",
    "message":"Tomorrow is declared a holiday.",
    "priority":"MEDIUM",
    "notificationType":"HOLIDAY"
}
## Success Response
201 Created
{
    "success": true,
    "message":"Notification broadcast successfully."
}
## Database Tables Used
notification
admin_user
change_log

## Business Logic
Retrieve all active administrators.
Create notification for each administrator.
Log broadcast operation.
## Notification Types
SYSTEM

ATTENDANCE

DEVICE

CONFLICT

SYNC

HOLIDAY

TIMETABLE

SECURITY

ANNOUNCEMENT

## Priority Levels
LOW

MEDIUM

HIGH

CRITICAL

## Notification API Summary
Method	Endpoint	Description
GET	/api/v1/notifications	Get All Notifications
GET	/api/v1/notifications/{id}	Notification Details
POST	/api/v1/notifications	Create Notification
PUT	/api/v1/notifications/{id}/read	Mark as Read
PUT	/api/v1/notifications/read-all	Mark All as Read
DELETE	/api/v1/notifications/{id}	Archive Notification
GET	/api/v1/notifications/unread-count	Unread Count
POST	/api/v1/notifications/broadcast	Broadcast Notification

## Security
Only authenticated administrators can access notifications.
Only SUPER_ADMIN can broadcast notifications.
Users can only view their own notifications unless they have elevated privileges.
All notification creation, deletion, and broadcast operations are recorded in the ChangeLog.

## Notification Workflow
System Event
      │
      ▼
Notification Generated
      │
      ▼
Notification Table
      │
      ▼
Dashboard Notification Panel
      │
      ├────────► Administrator Reads
      │
      ├────────► Mark as Read
      │
      └────────► Archive Notification

# 12. Holiday Module
## Module Overview

The Holiday module manages institutional, national, and emergency holidays within the FaceGate system.

Holiday information is used by the Attendance Session service to prevent attendance generation on non-working days. The module also synchronizes holiday data with Android devices to ensure offline attendance behaves consistently.

All Holiday APIs require administrator authentication unless otherwise specified.

## 1. Create Holiday
## Endpoint
POST /api/v1/holidays
## Description
Creates a new holiday.

## Authentication
Bearer Token Required (Admin Only)

## Headers
Header	Value
Authorization	Bearer <JWT_TOKEN>
Content-Type	application/json
## Request Body
{
  "calendarId":"c12e5a91-8b34-4f0e-9d61-5d6f87d3b2c8",
  "holidayName":"Independence Day",
  "holidayType":"NATIONAL",
  "description":"National Holiday",
  "holidayDate":"2026-08-15",
  "isRecurring":true
}
## Validation Rules
Field	Validation
calendarId	Must exist
holidayName	Required
holidayDate	Required
holidayType	Valid Enum
## Success Response
201 Created
{
    "success":true,
    "message":"Holiday created successfully."
}
## Error Response
409 Conflict
{
    "success":false,
    "message":"Holiday already exists."
}
## Database Tables Used
holiday
academic_calendar
admin_user
change_log

## Business Logic
Verify calendar exists.
Ensure duplicate holiday does not exist.
Save holiday.
Update Academic Calendar.
Record ChangeLog.

## 2. Get All Holidays
## Endpoint
GET /api/v1/holidays
## Description
Returns all holidays.

## Query Parameters
Parameter	Description
year	Academic Year
type	Holiday Type
page	Page Number
limit	Records Per Page
## Success Response
{
  "success":true,
  "holidays":[
      {
          "holidayName":"Independence Day",
          "date":"2026-08-15",
          "type":"NATIONAL"
      }
  ]
}
## Database Tables Used
holiday

## 3. Get Holiday Details
## Endpoint
GET /api/v1/holidays/{holidayId}
## Description
Returns detailed information about a holiday.

## Success Response
{
  "success":true,
  "data":{
      "holidayName":"Independence Day",
      "description":"National Holiday",
      "holidayType":"NATIONAL",
      "date":"2026-08-15"
  }
}
## Database Tables Used
holiday

## 4. Update Holiday
## Endpoint
PUT /api/v1/holidays/{holidayId}
## Description
Updates an existing holiday.

## Request Body
{
    "description":"National Holiday Celebration"
}
## Success Response
200 OK
{
    "success":true,
    "message":"Holiday updated successfully."
}
## Database Tables Used
holiday
change_log

## Business Logic
Update holiday.
Synchronize changes.
Record ChangeLog.

## 5. Delete Holiday
## Endpoint
DELETE /api/v1/holidays/{holidayId}
## Description
Archives a holiday.

## Success Response
{
    "success":true,
    "message":"Holiday removed successfully."
}
## Database Tables Used
holiday
change_log

## Business Logic
Instead of deleting
is_active = false

## 6. Get Upcoming Holidays
## Endpoint
GET /api/v1/holidays/upcoming
## Description
Returns upcoming holidays.

## Success Response
{
    "success":true,
    "holidays":[
        {
            "holidayName":"Independence Day",
            "date":"2026-08-15",
            "daysRemaining":30
        }
    ]
}
## Database Tables Used
holiday

## 7. Holiday Synchronization
## Endpoint
GET /api/v1/holidays/sync
## Description
Returns holiday updates for Android devices.

## Authentication
Device Token Required

## Query Parameters
Parameter	Description
lastSync	Return holidays updated after last synchronization
## Success Response
{
    "success":true,
    "count":5,
    "holidays":[
        {
            "holidayName":"Independence Day",
            "date":"2026-08-15"
        }
    ]
}
## Database Tables Used
holiday
device_sync_log

## Business Logic
Return only new or modified holidays.
Record synchronization.
## Holiday Types
NATIONAL

GAZETTED

INSTITUTIONAL

FESTIVAL

EMERGENCY

## Holiday API Summary
Method	Endpoint	Description
POST	/api/v1/holidays	Create Holiday
GET	/api/v1/holidays	Get All Holidays
GET	/api/v1/holidays/{id}	Holiday Details
PUT	/api/v1/holidays/{id}	Update Holiday
DELETE	/api/v1/holidays/{id}	Archive Holiday
GET	/api/v1/holidays/upcoming	Upcoming Holidays
GET	/api/v1/holidays/sync	Holiday Synchronization

## Security
Only administrators can create, update, or archive holidays.
Android devices can only access the synchronization endpoint using a valid Device Token.
Holiday changes are recorded in the ChangeLog.
Synchronization events are recorded in the DeviceSyncLog.
Attendance session generation checks the Holiday table before creating new sessions.

## Holiday Workflow
Administrator
      │
      ▼
Create / Update Holiday
      │
      ▼
Holiday Table Updated
      │
      ▼
Academic Calendar Updated
      │
      ▼
Attendance Session Generator
      │
      ▼
Skip Session Generation
      │
      ▼
Holiday Sync API
      │
      ▼
Android Devices Updated


# 13. Synchronization Module
## Module Overview

The Synchronization module enables secure communication between Android devices and the FaceGate backend.

It supports offline attendance collection by allowing Android devices to download required data (students, face embeddings, timetables, holidays, attendance sessions) and upload attendance records collected while offline.

The module also records synchronization history and detects synchronization conflicts.

## 1. Full Synchronization
## Endpoint
POST /api/v1/sync/full
## Description
Downloads all required data for a newly registered Android device.
This API is called during the first setup or when a complete resynchronization is required.

## Authentication
Device Token Required

## Headers
Header	Value
Authorization	Device Token
Content-Type	application/json
## Request Body
{
    "deviceId":"FG-ROOM101-TAB01",
    "appVersion":"1.0.0"
}
## Success Response
200 OK
{
    "success":true,
    "data":{
        "students":[],
        "faceEmbeddings":[],
        "timetable":[],
        "attendanceSessions":[],
        "holidays":[]
    }
}
## Database Tables Used
student
face_embedding
timetable
attendance_session
holiday
device
device_sync_log

## Business Logic
Verify device.
Download complete dataset.
Create DeviceSyncLog.

## 2. Incremental Synchronization
## Endpoint
GET /api/v1/sync/incremental
## Description
Returns only records modified after the previous synchronization.

## Authentication
Device Token Required

## Query Parameters
Parameter	Description
lastSync	Last synchronization timestamp
Example
GET /api/v1/sync/incremental?lastSync=2026-07-15T09:30:00Z
## Success Response
{
    "success":true,
    "changes":{
        "students":[],
        "faceEmbeddings":[],
        "timetable":[],
        "attendanceSessions":[],
        "holidays":[]
    }
}
## Database Tables Used
student
face_embedding
timetable
attendance_session
holiday
device_sync_log

## 3. Upload Offline Attendance
## Endpoint
POST /api/v1/sync/attendance
## Description
Uploads attendance records collected while offline.

## Authentication
Device Token Required

## Request Body
{
    "deviceId":"FG-ROOM101-TAB01",
    "attendance":[
        {
            "studentId":"...",
            "attendanceSessionId":"...",
            "recognitionConfidence":97.8,
            "attendanceTime":"2026-07-15T10:05:00Z"
        }
    ]
}
## Success Response
{
    "success":true,
    "uploaded":65,
    "failed":2
}
## Database Tables Used
attendance
attendance_session
conflict
device_sync_log

## Business Logic
Validate session.
Reject duplicates.
Save attendance.
Detect conflicts.
Update synchronization log.

## 4. Synchronize Attendance Sessions
## Endpoint
GET /api/v1/sync/attendance-sessions
## Description
Downloads active attendance sessions assigned to the device.

## Query Parameters
Parameter	Description
roomId	Device room
lastSync	Optional
## Success Response
{
    "success":true,
    "attendanceSessions":[]
}
## Database Tables Used
attendance_session
timetable
device

## 5. Synchronize Students
## Endpoint
GET /api/v1/sync/students
## Description
Downloads students assigned to the device's batches.

## Success Response
{
    "success":true,
    "students":[]
}
## Database Tables Used
student
batch
device

## 6. Synchronize Face Embeddings
## Endpoint
GET /api/v1/sync/face-embeddings
## Description
Downloads updated face embeddings.

## Success Response
{
    "success":true,
    "embeddings":[]
}
## Database Tables Used
face_embedding
student

## 7. Synchronize Timetable
## Endpoint
GET /api/v1/sync/timetable
## Description
Downloads timetable updates.

## Success Response
{
    "success":true,
    "timetable":[]
}
## Database Tables Used
timetable
faculty
subject
room

## 8. Synchronize Holidays
## Endpoint
GET /api/v1/sync/holidays
## Description
Downloads updated holidays.

## Success Response
{
    "success":true,
    "holidays":[]
}
## Database Tables Used
holiday

## 9. Heartbeat
## Endpoint
POST /api/v1/sync/heartbeat
## Description
Android periodically reports its health to the backend.

## Request Body
{
    "deviceId":"FG-ROOM101-TAB01",
    "battery":84,
    "network":"WiFi",
    "storageAvailable":18324
}
## Success Response
{
    "success":true
}
## Database Tables Used
device

## 10. Synchronization Status
## Endpoint
GET /api/v1/sync/status
## Description
Returns synchronization status of the requesting device.

## Success Response
{
    "success":true,
    "status":"SUCCESS",
    "lastSync":"2026-07-15T11:05:00Z",
    "pendingUploads":0
}
## Database Tables Used
device_sync_log
device

## 11. Retry Failed Synchronization
## Endpoint
POST /api/v1/sync/retry
## Description
Retries uploading failed attendance records.

## Success Response
{
    "success":true,
    "retried":2,
    "uploaded":2
}
## Database Tables Used
attendance
device_sync_log
conflict

## Synchronization API Summary
Method	Endpoint	Description
POST	/api/v1/sync/full	Full Device Synchronization
GET	/api/v1/sync/incremental	Incremental Synchronization
POST	/api/v1/sync/attendance	Upload Offline Attendance
GET	/api/v1/sync/attendance-sessions	Download Attendance Sessions
GET	/api/v1/sync/students	Download Students
GET	/api/v1/sync/face-embeddings	Download Face Embeddings
GET	/api/v1/sync/timetable	Download Timetable
GET	/api/v1/sync/holidays	Download Holidays
POST	/api/v1/sync/heartbeat	Device Heartbeat
GET	/api/v1/sync/status	Synchronization Status
POST	/api/v1/sync/retry	Retry Failed Synchronization

## Security
All synchronization APIs require a valid Device Token.
Communication must occur over HTTPS.
Each synchronization request is recorded in the DeviceSyncLog.
Devices can only download data relevant to their assigned room, batch, or timetable.
Incremental synchronization minimizes bandwidth by returning only modified records.
Duplicate attendance uploads are rejected automatically.
Synchronization conflicts are recorded in the Conflict table for administrator review.

## Synchronization Workflow
Android Device
      │
      ▼
Authenticate Using Device Token
      │
      ▼
Request Full / Incremental Sync
      │
      ├────────► Students
      ├────────► Face Embeddings
      ├────────► Timetable
      ├────────► Attendance Sessions
      └────────► Holidays
      │
      ▼
Offline Attendance Collection
      │
      ▼
Upload Attendance Records
      │
      ▼
Backend Validation
      │
      ├────────► Store Attendance
      ├────────► Generate Conflicts (if any)
      ├────────► Update DeviceSyncLog
      └────────► Return Synchronization Result

# 14. Administration (Master Data) Module
## Module Overview

The Administration module manages the master data of the FaceGate system. It provides CRUD operations for Departments, Batches, Faculty, Subjects, Rooms, Academic Calendar, and Administrator Users.

These APIs are accessible only to administrators and are used to configure the system before attendance operations begin.

## 1. Department APIs
## Endpoints
Method	Endpoint	Description
POST	/api/v1/departments	Create Department
GET	/api/v1/departments	Get All Departments
GET	/api/v1/departments/{id}	Department Details
PUT	/api/v1/departments/{id}	Update Department
DELETE	/api/v1/departments/{id}	Archive Department
Example Request
POST /api/v1/departments
{
    "departmentCode":"CSE",
    "departmentName":"Computer Science and Engineering"
}
## Database Tables
department
change_log

## 2. Batch APIs
Method	Endpoint
POST	/api/v1/batches
GET	/api/v1/batches
GET	/api/v1/batches/{id}
PUT	/api/v1/batches/{id}
DELETE	/api/v1/batches/{id}

Example

{
    "batchCode":"CSE-2024-A",
    "departmentId":"...",
    "semester":5,
    "section":"A"
}
## Database Tables
batch
department
change_log

## 3. Faculty APIs
Method	Endpoint
POST	/api/v1/faculties
GET	/api/v1/faculties
GET	/api/v1/faculties/{id}
PUT	/api/v1/faculties/{id}
DELETE	/api/v1/faculties/{id}

Example

{
    "employeeId":"PECF001",
    "fullName":"Dr. Sharma",
    "email":"sharma@pec.edu.in",
    "departmentId":"..."
}
## Database Tables
faculty
department
change_log
## 4. Subject APIs
Method	Endpoint
POST	/api/v1/subjects
GET	/api/v1/subjects
GET	/api/v1/subjects/{id}
PUT	/api/v1/subjects/{id}
DELETE	/api/v1/subjects/{id}

Example

{
    "subjectCode":"CS301",
    "subjectName":"Data Structures",
    "credits":4,
    "departmentId":"..."
}
## Database Tables
subject
department
change_log

## 5. Room APIs
**Corrected 2026-07-10** — this section was documented but had no matching
route/controller/repository in the backend at all; there was no way to create a room
except connecting to Postgres directly, which also blocked device pairing (every device
needs a room_id). Now implemented at `RoomController`/`RoomService`/`RoomRepository`. The
example below is also corrected — the field names previously shown (`roomNumber`,
`building`) didn't match the actual `room` table columns.

Method	Endpoint
POST	/api/v1/rooms
GET	/api/v1/rooms
GET	/api/v1/rooms/{roomId}
PUT	/api/v1/rooms/{roomId}
DELETE	/api/v1/rooms/{roomId}

## Authentication
None (no admin login exists in this build — see Section 9 of the architecture doc).

Example request (POST /api/v1/rooms)

{
    "room_number":"Room-101",
    "room_name":"Lecture Hall",
    "building_name":"Academic Block",
    "floor_number":1,
    "room_type":"Lecture Hall",
    "capacity":80,
    "has_projector":true,
    "has_wifi":true
}

room_number, building_name, room_type, and capacity are required; the rest are optional.
room_type must be one of: Lecture Hall, Laboratory, Seminar Hall, Tutorial Room, Conference
Room (matches the CHECK constraint on the room table).

Success Response (201 Created)
{
    "success":true,
    "message":"Room created successfully",
    "data":{
        "room_id":"6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1",
        "room_number":"Room-101",
        "building_name":"Academic Block",
        "room_type":"Lecture Hall",
        "capacity":80
    }
}

DELETE deactivates (soft delete, is_active = false) rather than removing the row, matching
the pattern used everywhere else in this API.

## Database Tables
room

## 6. Academic Calendar APIs
Method	Endpoint
POST	/api/v1/academic-calendar
GET	/api/v1/academic-calendar
GET	/api/v1/academic-calendar/{id}
PUT	/api/v1/academic-calendar/{id}
DELETE	/api/v1/academic-calendar/{id}

Example

{
    "calendarDate":"2026-07-15",
    "isWorkingDay":true,
    "academicYear":"2026-27"
}
## Database Tables
academic_calendar
change_log

## 7. Admin User APIs
Method	Endpoint
POST	/api/v1/admin-users
GET	/api/v1/admin-users
GET	/api/v1/admin-users/{id}
PUT	/api/v1/admin-users/{id}
DELETE	/api/v1/admin-users/{id}
PUT	/api/v1/admin-users/{id}/role
PUT	/api/v1/admin-users/{id}/status

Example

{
    "employeeId":"PECADM001",
    "fullName":"Dr. Anjali Sharma",
    "email":"admin@pec.edu.in",
    "role":"SUPER_ADMIN"
}
## Database Tables
admin_user
change_log
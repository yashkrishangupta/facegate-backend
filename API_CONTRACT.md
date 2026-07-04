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

All APIs require administrator authentication except synchronization APIs used by registered devices.

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

It provides APIs for device registration, authentication, status monitoring, heartbeat communication, synchronization, and device management.

Only registered and active devices are allowed to synchronize attendance data with the backend.

## 1. Register Device
## Endpoint
POST /api/v1/devices
## Description
Registers a new Android device with the FaceGate backend.

## Authentication
Bearer Token Required (Admin Only)

## Headers
Header	Value
## Authorization	Bearer <JWT_TOKEN>
Content-Type	application/json
## Request Body
{
    "deviceId":"FG-ROOM101-TAB01",
    "deviceName":"Room 101 Tablet",
    "roomId":"6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1",
    "appVersion":"1.0.0",
    "osVersion":"Android 14"
}
## Success Response
201 Created
{
    "success":true,
    "message":"Device registered successfully."
}
## Database Tables Used
device
room
change_log

## Business Logic
Verify room exists.
Ensure device ID is unique.
Register device.
Log registration.

## 2. Get All Devices
## Endpoint
GET /api/v1/devices
## Description
Returns all registered devices.

## Authentication
Bearer Token Required

## Query Parameters
Parameter	Description
roomId	Filter by room
status	Active / Inactive
page	Page number
limit	Records per page
## Success Response
{
    "success":true,
    "devices":[
        {
            "deviceId":"FG-ROOM101-TAB01",
            "room":"LH101",
            "status":"ONLINE",
            "lastSync":"2026-07-15T10:45:00Z"
        }
    ]
}
## Database Tables Used
device

## 3. Get Device Details
## Endpoint
GET /api/v1/devices/{deviceId}
## Description
Returns detailed information about one device.

## Success Response
{
    "success":true,
    "data":{
        "deviceId":"FG-ROOM101-TAB01",
        "deviceName":"Room 101 Tablet",
        "room":"LH101",
        "status":"ONLINE",
        "batteryLevel":82,
        "lastSeen":"2026-07-15T10:50:00Z",
        "lastSync":"2026-07-15T10:45:00Z"
    }
}
## Database Tables Used
device
room
device_sync_log

## 4. Update Device
## Endpoint
PUT /api/v1/devices/{deviceId}
## Description
Updates device information.

## Request Body
{
    "deviceName":"Computer Lab Tablet",
    "roomId":"..."
}
## Success Response
200 OK
{
    "success":true,
    "message":"Device updated successfully."
}
## Database Tables Used
device
change_log

## 5. Deactivate Device
## Endpoint
DELETE /api/v1/devices/{deviceId}
## Description
Marks a device as inactive.

## Success Response
{
    "success":true,
    "message":"Device deactivated successfully."
}
## Business Logic
Device is not deleted.
Set
is_active = false

## Database Tables Used
device
change_log

## 6. Device Heartbeat
## Endpoint
POST /api/v1/devices/heartbeat

## Description
Android device periodically informs the server that it is online.

## Authentication
Device Token Required

## Request Body
{
    "deviceId":"FG-ROOM101-TAB01",
    "batteryLevel":78,
    "storageAvailable":18234,
    "networkStatus":"ONLINE"
}
## Success Response
{
    "success":true,
    "message":"Heartbeat received."
}
## Database Tables Used
device
## Business Logic
Update
last_seen
battery_level
storage_available
network_status

## 7. Get Device Health
## Endpoint
GET /api/v1/devices/{deviceId}/health
## Description
Returns live health information for a device.

## Success Response
{
    "batteryLevel":80,
    "networkStatus":"ONLINE",
    "storageAvailable":18500,
    "lastSeen":"2026-07-15T11:20:00Z",
    "syncStatus":"SUCCESS"
}
## Database Tables Used
device
device_sync_log

## 8. Get Device Synchronization History
## Endpoint
GET /api/v1/devices/{deviceId}/sync-history
## Description
Returns synchronization history of a device.

## Success Response
{
    "success":true,
    "history":[
        {
            "syncType":"ATTENDANCE_UPLOAD",
            "status":"SUCCESS",
            "time":"2026-07-15T10:45:00Z"
        }
    ]
}
## Database Tables Used
device
device_sync_log
## Device API Summary
Method	Endpoint	Description
POST	/api/v1/devices	Register Device
GET	/api/v1/devices	Get All Devices
GET	/api/v1/devices/{deviceId}	Device Details
PUT	/api/v1/devices/{deviceId}	Update Device
DELETE	/api/v1/devices/{deviceId}	Deactivate Device
POST	/api/v1/devices/heartbeat	Device Heartbeat
GET	/api/v1/devices/{deviceId}/health	Device Health
GET	/api/v1/devices/{deviceId}/sync-history	Device Sync History
Security
Only administrators can register or update devices.
Every Android device receives a unique Device Token after registration.
Only active devices can synchronize attendance.
Every device operation is recorded in the ChangeLog.
Heartbeat requests update the live dashboard.
Device synchronization events are stored in the DeviceSyncLog.

## Device Workflow
Admin
   │
   ▼
Register Device
   │
   ▼
Device Receives Token
   │
   ▼
Heartbeat Every Few Minutes
   │
   ▼
Sync Attendance
   │
   ▼
DeviceSyncLog Updated
   │
   ▼
Dashboard Displays Live Status


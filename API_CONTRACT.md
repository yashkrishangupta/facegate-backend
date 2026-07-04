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
# FaceGate API Contract

# Authentication Module
## Module Overview

The Authentication module is responsible for verifying administrator credentials, generating secure access tokens, maintaining user sessions, and authorizing access to the FaceGate backend.

All protected endpoints require a valid JWT Bearer Token issued after successful authentication.

# 1. Login API
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


# 2. Logout API
# Endpoint
POST /api/v1/auth/logout

# Description
Terminates the current administrator session.

# Authentication
Bearer Token Required

# Headers
Authorization: Bearer <JWT_TOKEN>
# Request Body
{}
# Success Response
200 OK
{
    "success": true,
    "message": "Logged out successfully"
}
# Error Response
401 Unauthorized
{
    "success": false,
    "message": "Invalid token"
}
# Database Tables Used
admin_user
change_log
# Business Logic
Validate JWT.
Invalidate refresh/session token (if implemented).
Record logout in ChangeLog.

# 3. Get Profile API
# Endpoint
GET /api/v1/auth/profile

# Description
Returns the profile information of the currently authenticated administrator.

# Authentication
Bearer Token Required

# Headers
Authorization: Bearer <JWT_TOKEN>
# Success Response
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
# Error Response
401 Unauthorized
{
    "success": false,
    "message": "Authentication required"
}
# Database Tables Used
admin_user
Business Logic
Validate JWT.
Fetch administrator details.
Return profile information.

# 4. Refresh Token API
# Endpoint
POST /api/v1/auth/refresh-token

# Description
Generates a new JWT access token using a valid refresh token.

# Authentication
Refresh Token Required

# Request Body
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
# Success Response
200 OK
{
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
}
# Error Response
401 Unauthorized
{
    "success": false,
    "message": "Refresh token expired"
}
# Database Tables Used
admin_user
Business Logic
Validate refresh token.
Verify administrator.
Generate new JWT.
Return new access token.

# Authentication Flow
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

# Security Features
JWT-based authentication.
Passwords hashed using bcrypt.
Role-Based Access Control (RBAC).
HTTPS-only communication.
Input validation and sanitization.
Login/logout audit entries stored in ChangeLog.
Token expiration support.
Disabled account protection.
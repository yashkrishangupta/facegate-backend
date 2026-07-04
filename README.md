# FaceGate Backend

## FaceGate

FaceGate is an AI-powered face recognition attendance management system designed for educational institutions. It provides an offline-first Android application for attendance marking, a centralized backend for synchronization and data management, and a web dashboard for administration, reporting, and live monitoring.

The project is designed to eliminate manual attendance, reduce proxy attendance, simplify academic administration, and provide real-time attendance insights while ensuring reliable operation even when devices temporarily lose internet connectivity.

---

# Project Components

The complete FaceGate ecosystem consists of three major components.

## 1. Android Application

The Android application is responsible for:

- Face recognition using Google ML Kit and MobileFaceNet
- Student enrollment
- Attendance marking
- Offline attendance storage
- Background synchronization
- Timetable retrieval
- Holiday synchronization
- Conflict detection

Technology Stack

- Kotlin
- Android Studio
- CameraX
- Room Database
- Google ML Kit
- MobileFaceNet

---

## 2. Backend API

The backend acts as the central communication layer between Android devices and the web dashboard.

Responsibilities include:

- Student Management
- Device Management
- Attendance Synchronization
- Timetable Management
- Holiday Management
- Attendance Reports
- Live Dashboard
- Conflict Resolution
- Device Authentication

Technology Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication

### Backend Responsibilities

The backend serves as the central source of truth for the entire FaceGate ecosystem.

It is responsible for:

- Maintaining student records
- Managing attendance sessions
- Synchronizing attendance from Android devices
- Storing face embeddings
- Managing academic timetables
- Managing holidays
- Generating attendance reports
- Maintaining change logs
- Monitoring registered devices
- Providing APIs for the web dashboard

---

## 3. Web Dashboard

The web dashboard provides administrative control over the entire system.

Features include:

- Student Management
- Device Monitoring
- Attendance Reports
- Timetable Setup
- Holiday Setup
- Analytics Dashboard
- Live Attendance Monitoring
- Conflict Queue
- Change Logs

Technology Stack

- React
- TypeScript
- Tailwind CSS
- Axios

---

# System Architecture

```

Android Devices

↓

REST APIs

↓

FaceGate Backend

↓

PostgreSQL Database

↓

Web Dashboard

```

All communication between the Android application and the website passes through the backend API.

The Android application never communicates directly with the web dashboard.

---

# Key Features

## Student Management

- Add Student
- Update Student
- Delete Student
- Search Students
- Face Enrollment

---

## Attendance Management

- Face Recognition Attendance
- Manual Attendance
- Attendance Synchronization
- Attendance History
- Attendance Reports

---

## Timetable

- Create Timetable
- Update Timetable
- Weekly Schedule
- Session Management

---

## Holiday Management

- Add Holiday
- Remove Holiday
- Holiday Synchronization

---

## Reports

- Student Reports
- Batch Reports
- Subject Reports
- Room Reports
- Monthly Reports

---

## Dashboard

Displays

- Total Students
- Registered Devices
- Today's Attendance
- Active Sessions
- Active Devices
- Attendance Percentage
- Pending Synchronization
- Attendance Conflicts

---

# Offline First Architecture

FaceGate is designed using an offline-first architecture.

Android devices continue marking attendance even without an internet connection.

Whenever connectivity becomes available, attendance records are synchronized automatically with the backend.

This ensures that attendance is never lost due to network failures.

---

# Database

The backend stores the following entities.

- Student
- Attendance
- Device
- Session
- Timetable
- Holiday
- Face Embedding
- Conflict
- Change Log

Detailed database documentation is available in:

DATABASE_DESIGN.md

---

# API Documentation

All REST APIs are documented inside:

API_CONTRACT.md

The API contract defines:

- Endpoints
- Authentication
- Request Format
- Response Format
- Status Codes
- Validation Rules

---

# Authentication

The system supports two authentication mechanisms.

## Admin Authentication

Administrators authenticate using JWT tokens.

Authenticated users can:

- Manage Students
- Manage Timetable
- Manage Holidays
- View Reports
- Resolve Conflicts

---

## Device Authentication

Each Android device is paired with the backend.

Every synchronized request includes a valid device token.

Only registered devices are allowed to upload attendance.

---

# Synchronization

Synchronization is responsible for exchanging data between Android devices and the backend.

The following data is synchronized.

Android → Backend

- Attendance
- Enrollment Requests
- Device Status

Backend → Android

- Students
- Face Embeddings
- Timetable
- Holidays
- Configuration Updates

# Prerequisites

Before running the project, ensure the following software is installed:

- Node.js (v20 or later)
- npm
- PostgreSQL (v16 or later)
- Git
- Docker (Optional)
- Postman (API Testing)
- VS Code

---

# Repository Structure

```

FaceGate-Backend
│
├── .github/
│
├── api/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── web/
│
├── tests/
│
├── README.md
├── API_CONTRACT.md
├── DATABASE_DESIGN.md
└── docker-compose.yml
```

---

# Development Workflow

1. Design Database

2. Finalize API Contract

3. Implement Backend APIs

4. Connect Android Application

5. Connect Web Dashboard

6. Perform Testing

7. Deploy Backend

---

# Deployment

Backend

Node.js + Express

Database

PostgreSQL

Frontend

React

Android

APK Distribution

---

# Contributors

Backend Team

Frontend Team

Android Team

---

# Future Scope

- Face Anti-Spoof Detection
- Parent Portal
- Cloud Synchronization
- Multi-Campus Support
- Notification System
- AI-Based Attendance Analytics
- Mobile Dashboard

---

# License

This project is developed as part of the FaceGate Attendance Management System.

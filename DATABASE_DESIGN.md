# FaceGate Database Design

## Document Information

**Project:** FaceGate – AI Powered Face Recognition Attendance Management System

**Version:** 1.0

**Module:** Backend Database Design

**Database:** PostgreSQL

**Prepared By:** Backend Team

---

# 1. Introduction

## Purpose

This document describes the database architecture for the FaceGate Attendance Management System.

The database acts as the centralized source of truth for the entire application and stores information required by both the Android application and the web dashboard.

The primary objectives of the database are:

- Store student information
- Store attendance records
- Store academic timetable
- Manage Android devices
- Store face embeddings
- Maintain synchronization logs
- Maintain audit logs
- Generate reports

---

# 2. Database Design Principles

The database has been designed according to the following principles.

- Normalized schema (3NF)
- UUID based primary keys
- Referential Integrity
- Offline-first synchronization
- Optimized for reporting
- Easy scalability
- Secure data storage

---

# 3. Entity Relationship Overview

The backend consists of the following entities.

Student

↓

Attendance

↓

Session

↓

Device

↓

Timetable

↓

Holiday

↓

FaceEmbedding

↓

Conflict

↓

ChangeLog



# 4. Student

## Purpose

The **Student** table stores the master information of every student registered in the FaceGate system.

A student record is created by an administrator before the face enrollment process begins. Each student has a unique identity within the institution and is associated with exactly one face embedding.

The Student table serves as the primary source of student information for:

- Android attendance devices
- Web dashboard
- Attendance reports
- Timetable mapping
- Face enrollment
- Attendance synchronization

---

## Table Name

student

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for every student |
| roll_number | VARCHAR(30) | UNIQUE, NOT NULL | Official roll number of the student |
| full_name | VARCHAR(150) | NOT NULL | Complete name of the student |
| email | VARCHAR(120) | UNIQUE | Institutional email address |
| phone | VARCHAR(20) | NULL | Contact number |
|batch_id | UUID | FOREIGN KEY, NOT NULL | References the student's academic batch
| status | BOOLEAN | DEFAULT TRUE | Indicates whether the student is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification time |

---

## Primary Key

id

---

## Unique Constraints

- roll_number
- email

---

## Relationships

### Attendance

One student can have multiple attendance records.

Student (1)

↓

Attendance (N)

---

### Face Embedding

Each student has exactly one face embedding.

Student (1)

↓

FaceEmbedding (1)

---

### Timetable

Students are linked to timetable sessions through their assigned batch.

Student

↓

Batch

↓

Timetable

---

## Indexes

The following indexes should be created to improve query performance.

| Index | Purpose |
|--------|---------|
| roll_number | Fast student lookup during attendance |
| batch | Retrieve students belonging to a batch |
| full_name | Search students by name |
| email | Login and communication |
| status | Filter active students |

---

## Business Rules

- Every student must have a unique roll number.
- A student must belong to exactly one batch.
- A student may optionally belong to a section.
- A student can only have one active face embedding at any point in time.
- Deleted students should be marked inactive instead of being permanently removed from the database to preserve historical attendance records.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 9bfb2fd5-27a4-4d55-b38f-3d65f0d82c61 |
| roll_number | 22104020 |
| full_name | Rahul Sharma |
| email | rahul.sharma@college.edu |
| phone | 9876543210 |
| batch | CSE-2024 |
| semester | 5 |
| section | A |
| status | TRUE |
| created_at | 2026-07-04 09:15:00 |
| updated_at | 2026-07-04 09:15:00 |

---

## Notes

- UUIDs are used instead of auto-incrementing integers to simplify synchronization between offline Android devices and the central backend.
- Student records are synchronized with authorized Android devices based on the institution's synchronization policy.
- Historical attendance records remain intact even if a student is marked inactive.

# 5. FaceEmbedding

## Purpose

The **FaceEmbedding** table stores the facial feature vectors generated during the student enrollment process.

Instead of storing student photographs, the system stores numerical face embeddings produced by the face recognition model. These embeddings are used during attendance to compare a detected face against enrolled students.

Each student can have only one active face embedding.

The table is designed to support future upgrades of the face recognition model without requiring changes to the database schema.

---

## Table Name

face_embedding

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique embedding identifier |
| student_id | UUID | FOREIGN KEY, UNIQUE, NOT NULL | References the enrolled student |
| embedding_data | BYTEA / VECTOR | NOT NULL | Serialized face embedding generated by the recognition model |
| embedding_dimension | INTEGER | NOT NULL | Number of values in the embedding vector (e.g., 192, 512) |
| model_name | VARCHAR(100) | NOT NULL | Name of the face recognition model used |
| model_version | VARCHAR(20) | NOT NULL | Version of the recognition model |
| enrollment_device | UUID | FOREIGN KEY | Device used during enrollment |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Enrollment timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

---

## Primary Key

id

---

## Foreign Keys

student_id → student(id)

enrollment_device → device(id)

---

## Relationships

### Student

One student has exactly one face embedding.

Student (1)

↓

FaceEmbedding (1)

---

### Device

One Android device may enroll multiple students.

Device (1)

↓

FaceEmbedding (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| student_id | Retrieve embedding for recognition |
| model_name | Filter embeddings by recognition model |
| model_version | Support future model upgrades |

---

## Business Rules

- Every student can have only one active face embedding.
- Face photographs are **not** stored in the database.
- Only numerical embeddings generated by the recognition model are stored.
- Updating an embedding replaces the previous embedding for that student.
- Embeddings generated by different recognition models should not be compared directly.
- The system should support future upgrades to newer recognition models.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 4c8c98a2-8b18-4e5f-a927-47d6bc98ef35 |
| student_id | 9bfb2fd5-27a4-4d55-b38f-3d65f0d82c61 |
| embedding_data | Binary Vector |
| embedding_dimension | 192 |
| model_name | MobileFaceNet |
| model_version | v1.0 |
| enrollment_device | d7ae8ab4-d2f4-4c71-bff4-55a2d2d1b3e9 |
| created_at | 2026-07-04 10:25:00 |
| updated_at | 2026-07-04 10:25:00 |

---

## Notes

- Face embeddings are mathematical representations of facial features and cannot be directly viewed as images.
- The Android application performs face detection and alignment before generating embeddings.
- Embeddings are synchronized securely between authorized Android devices and the backend.
- During attendance, the recognition engine compares the detected embedding with the stored embedding to determine the student's identity.

# 6. Device

## Purpose

The **Device** table stores information about every Android device registered with the FaceGate system.

Each Android device must be paired with the backend before it can synchronize attendance records or download academic data.

The table is responsible for:

- Device registration
- Device authentication
- Attendance synchronization
- Monitoring device health
- Tracking synchronization status
- Managing room assignments

---

## Table Name

device

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the device |
| device_id | VARCHAR(100) | UNIQUE, NOT NULL | Unique hardware/device identifier |
| device_name | VARCHAR(100) | NOT NULL | User-friendly device name (e.g., Room 101 Tablet) |
| assigned_room | VARCHAR(50) | NOT NULL | Classroom or room assigned to the device |
| app_version | VARCHAR(20) | NOT NULL | Installed FaceGate application version |
| os_version | VARCHAR(30) | NULL | Android operating system version |
| battery_level | INTEGER | NULL | Battery percentage (0–100) |
| storage_available | BIGINT | NULL | Available storage in MB |
| network_status | VARCHAR(20) | DEFAULT 'ONLINE' | ONLINE / OFFLINE |
| sync_status | VARCHAR(20) | DEFAULT 'IDLE' | IDLE / SYNCING / FAILED |
| last_sync | TIMESTAMP | NULL | Last successful synchronization time |
| last_seen | TIMESTAMP | NULL | Last heartbeat received from the device |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the device is authorized |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

---

## Primary Key

id

---

## Unique Constraints

- device_id

---

## Relationships

### Attendance

One device can upload many attendance records.

Device (1)

↓

Attendance (N)

---

### Face Embedding

One device can enroll multiple students.

Device (1)

↓

FaceEmbedding (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| device_id | Fast device lookup |
| assigned_room | Find devices assigned to a room |
| last_sync | Monitor synchronization status |
| sync_status | Display devices requiring attention |
| network_status | Monitor online/offline devices |

---

## Business Rules

- Every device must be registered before use.
- Every device has a unique hardware identifier.
- Only active devices can synchronize with the backend.
- Attendance uploads are accepted only from authenticated devices.
- Device health information should be updated during every synchronization.
- Devices that have not communicated for a long time may be marked offline automatically.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 6f3d8b0c-fc2f-4b1e-a8d7-1a84d5d8b6b3 |
| device_id | FG-ROOM101-TAB01 |
| device_name | Room 101 Tablet |
| assigned_room | Room 101 |
| app_version | 1.0.0 |
| os_version | Android 14 |
| battery_level | 82 |
| storage_available | 18432 |
| network_status | ONLINE |
| sync_status | IDLE |
| last_sync | 2026-07-05 09:30:12 |
| last_seen | 2026-07-05 09:35:47 |
| is_active | TRUE |
| created_at | 2026-06-28 10:00:00 |
| updated_at | 2026-07-05 09:35:47 |

---

## Notes

- Every Android device must complete the pairing process before accessing backend APIs.
- The backend issues an authentication token after successful pairing.
- Device health information is periodically synchronized to support live monitoring through the web dashboard.
- Devices can be remotely disabled by administrators without deleting their historical attendance records.

# 7. Batch

## Purpose

The **Batch** table stores the master information of academic batches within the institution.

A batch represents a group of students enrolled in the same academic program and admission year. It serves as a reference table for students, timetables, attendance sessions, and academic reports.

Instead of storing batch information repeatedly in multiple tables, the system references the Batch table using foreign keys, ensuring consistency and reducing data duplication.

---

## Table Name

batch

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the batch |
| batch_code | VARCHAR(30) | UNIQUE, NOT NULL | Unique batch code (e.g., CSE-2024-A) |
|department_id | UUID | FOREIGN KEY, NOT NULL | References the department offering the batch
| program | VARCHAR(50) | NOT NULL | Degree program (B.Tech, M.Tech, MCA, etc.) |
| admission_year | INTEGER | NOT NULL | Year of admission |
| graduation_year | INTEGER | NOT NULL | Expected year of graduation |
| section | VARCHAR(10) | NULL | Batch section (A, B, C, etc.) |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the batch is currently active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Unique Constraints

- batch_code

---

## Relationships

### Student

One batch contains multiple students.

Batch (1)

↓

Student (N)

---

### Timetable

One batch can have multiple timetable entries.

Batch (1)

↓

Timetable (N)

---

### AttendanceSession

One batch can have multiple attendance sessions.

Batch (1)

↓

AttendanceSession (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| batch_code | Fast batch lookup |
| department | Department-wise filtering |
| admission_year | Admission year filtering |
| is_active | Retrieve active batches |

---

## Business Rules

- Every batch must have a unique batch code.
- A batch belongs to exactly one department.
- A batch belongs to exactly one academic program.
- Students can only be assigned to an existing batch.
- Inactive batches cannot be assigned to newly enrolled students.
- Historical attendance records remain valid even if a batch becomes inactive.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | b2a7d8d3-8f3a-4d6a-b9b4-c62d83b73f11 |
| batch_code | CSE-2024-A |
| department | Computer Science & Engineering |
| program | B.Tech |
| admission_year | 2024 |
| graduation_year | 2028 |
| section | A |
| is_active | TRUE |
| created_at | 2026-07-05 09:00:00 |
| updated_at | 2026-07-05 09:00:00 |

---

## Notes

- The Batch table is a master table referenced throughout the FaceGate system.
- Student records store only the `batch_id` foreign key instead of repeating batch details.
- Timetable, AttendanceSession, and Reports use batch references to maintain consistency.
- The `batch_code` should follow a standard naming convention across the institution (e.g., CSE-2024-A, ECE-2023-B).


# 8. Faculty

## Purpose

The **Faculty** table stores the master information of all faculty members associated with the institution.

Faculty members are responsible for conducting attendance sessions, teaching subjects, and managing academic activities. Instead of storing faculty names repeatedly in multiple tables, the system references the Faculty table using foreign keys.

This approach ensures data consistency, eliminates duplication, and supports future features such as faculty login, workload management, and performance analytics.

---

## Table Name

faculty

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the faculty member |
| employee_id | VARCHAR(30) | UNIQUE, NOT NULL | Official employee ID assigned by the institution |
| full_name | VARCHAR(150) | NOT NULL | Full name of the faculty member |
| email | VARCHAR(120) | UNIQUE, NOT NULL | Institutional email address |
| phone | VARCHAR(20) | NULL | Contact number |
| department_id | UUID | FOREIGN KEY, NOT NULL | References the faculty's department
| designation | VARCHAR(50) | NOT NULL | Assistant Professor, Associate Professor, Professor, etc. |
| specialization | VARCHAR(100) | NULL | Area of specialization |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the faculty member is currently active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Unique Constraints

- employee_id
- email

---

## Relationships

### Timetable

One faculty member can teach multiple timetable entries.

Faculty (1)

↓

Timetable (N)

---

### AttendanceSession

One faculty member can conduct multiple attendance sessions.

Faculty (1)

↓

AttendanceSession (N)

---

### Reports

Attendance reports can be generated faculty-wise.

Faculty (1)

↓

Attendance Reports (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| employee_id | Fast faculty lookup |
| department | Department-wise filtering |
| email | Authentication and communication |
| designation | Administrative reports |
| is_active | Retrieve active faculty members |

---

## Business Rules

- Every faculty member must have a unique employee ID.
- Every faculty member must have a unique institutional email.
- Only active faculty members can be assigned to timetable entries.
- Historical attendance records remain unchanged even if a faculty member becomes inactive.
- Faculty members may teach multiple batches and subjects.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 5f91f0d3-7c32-4d3a-a8d1-6b5d8d27e3f1 |
| employee_id | PEC-CS-102 |
| full_name | Dr. Anjali Sharma |
| email | anjali.sharma@pec.edu.in |
| phone | 9876543210 |
| department | Computer Science & Engineering |
| designation | Associate Professor |
| specialization | Artificial Intelligence |
| is_active | TRUE |
| created_at | 2026-07-05 09:00:00 |
| updated_at | 2026-07-05 09:00:00 |

---

## Notes

- Faculty information is stored only once and referenced throughout the system using `faculty_id`.
- Timetable and AttendanceSession tables should store `faculty_id` instead of the faculty name.
- This design supports future expansion such as faculty authentication, profile management, workload calculation, and teaching analytics.

# 9. Subject

## Purpose

The **Subject** table stores the master information of all academic subjects offered by the institution.

Each subject is uniquely identified and associated with a department and academic semester. Instead of storing subject names repeatedly across multiple tables, the system references the Subject table using foreign keys.

This approach improves data consistency, minimizes redundancy, and enables subject-wise attendance reports and analytics.

---

## Table Name

subject

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the subject |
| subject_code | VARCHAR(30) | UNIQUE, NOT NULL | Official subject code (e.g., CS301) |
| subject_name | VARCHAR(150) | NOT NULL | Name of the subject |
| department | VARCHAR(100) | NOT NULL | Department offering the subject |
| credits | INTEGER | NOT NULL | Number of academic credits |
| semester | INTEGER | NOT NULL | Semester in which the subject is offered |
| subject_type | VARCHAR(30) | NOT NULL | Theory / Lab / Elective |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the subject is currently active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Unique Constraints

- subject_code

---

## Relationships

### Timetable

One subject can appear in multiple timetable entries.

Subject (1)

↓

Timetable (N)

---

### AttendanceSession

One subject can have multiple attendance sessions.

Subject (1)

↓

AttendanceSession (N)

---

### Attendance Reports

Attendance reports can be generated subject-wise.

Subject (1)

↓

Attendance Reports (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| subject_code | Fast subject lookup |
| subject_name | Search by subject name |
| department | Department-wise filtering |
| semester | Semester-wise subject listing |
| is_active | Retrieve active subjects |

---

## Business Rules

- Every subject must have a unique subject code.
- Every subject belongs to one department.
- A subject may have multiple timetable entries.
- A subject may be taught by multiple faculty members across different batches.
- Inactive subjects cannot be assigned to new timetable entries.
- Historical attendance records remain unchanged even if a subject becomes inactive.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | a1d3c5b8-9f7d-42d3-8b1f-5a7e8c6d9b20 |
| subject_code | CS301 |
| subject_name | Data Structures |
| department | Computer Science & Engineering |
| credits | 4 |
| semester | 5 |
| subject_type | Theory |
| is_active | TRUE |
| created_at | 2026-07-05 10:00:00 |
| updated_at | 2026-07-05 10:00:00 |

---

## Notes

- Subject information is stored only once and referenced throughout the system using `subject_id`.
- Timetable and AttendanceSession tables should store `subject_id` instead of the subject name.
- This design enables subject-wise analytics, attendance reports, and future curriculum management features.

# 10. Department

## Purpose

The **Department** table stores the master information of all academic departments within the institution.

A department represents an academic division responsible for offering programs, managing faculty members, and conducting academic activities.

Instead of storing department names repeatedly across multiple tables, the FaceGate system references the Department table using foreign keys. This improves data consistency, reduces redundancy, and simplifies future updates.

The Department table serves as the parent table for batches, faculty members, and subjects.

---

## Table Name

department

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the department |
| department_code | VARCHAR(20) | UNIQUE, NOT NULL | Official department code (e.g., CSE, ECE, ME) |
| department_name | VARCHAR(150) | UNIQUE, NOT NULL | Full department name |
| hod_name | VARCHAR(150) | NULL | Name of the Head of Department |
| office_email | VARCHAR(120) | NULL | Official department email |
| office_phone | VARCHAR(20) | NULL | Department contact number |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the department is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Unique Constraints

- department_code
- department_name

---

## Relationships

### Batch

One department can have multiple batches.

Department (1)

↓

Batch (N)

---

### Faculty

One department can have multiple faculty members.

Department (1)

↓

Faculty (N)

---

### Subject

One department can offer multiple subjects.

Department (1)

↓

Subject (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| department_code | Fast department lookup |
| department_name | Search by department |
| is_active | Retrieve active departments |

---

## Business Rules

- Every department must have a unique department code.
- Every department must have a unique department name.
- A department may contain multiple batches.
- A department may employ multiple faculty members.
- A department may offer multiple academic subjects.
- Inactive departments cannot be assigned to newly created batches, faculty members, or subjects.
- Historical attendance records remain unaffected if a department becomes inactive.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 8a3b2e41-c8b4-4c18-ae9d-7c2f1c8f64a1 |
| department_code | CSE |
| department_name | Computer Science & Engineering |
| hod_name | Dr. Amit Kumar |
| office_email | cse@pec.edu.in |
| office_phone | +91-172-2753050 |
| is_active | TRUE |
| created_at | 2026-07-05 09:00:00 |
| updated_at | 2026-07-05 09:00:00 |

---

## Notes

- The Department table is a master table referenced throughout the FaceGate system.
- Batch, Faculty, and Subject tables should store only the `department_id` foreign key.
- Department information is maintained centrally, ensuring consistency across the system.

# 11. Room

## Purpose

The **Room** table stores the master information of all classrooms, laboratories, seminar halls, and other academic spaces within the institution.

Every attendance session is conducted in a specific room. The Room table provides a centralized repository of room information, allowing the system to associate attendance sessions, timetables, and Android attendance devices with a physical location.

Instead of storing room names repeatedly across multiple tables, the FaceGate system references the Room table using foreign keys. This improves data consistency, reduces redundancy, and simplifies room management.

---

## Table Name

room

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the room |
| room_code | VARCHAR(30) | UNIQUE, NOT NULL | Unique room code (e.g., LH101, CSLAB1) |
| room_name | VARCHAR(100) | NOT NULL | Name of the room |
| building_name | VARCHAR(100) | NOT NULL | Building in which the room is located |
| floor_number | INTEGER | NULL | Floor number |
| room_type | VARCHAR(30) | NOT NULL | Classroom, Laboratory, Seminar Hall, Auditorium, etc. |
| capacity | INTEGER | NOT NULL | Maximum seating capacity |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the room is currently available |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Unique Constraints

- room_code

---

## Relationships

### Timetable

One room can have multiple timetable entries.

Room (1)

↓

Timetable (N)

---

### AttendanceSession

One room can host multiple attendance sessions.

Room (1)

↓

AttendanceSession (N)

---

### Device

One room may contain one or more registered FaceGate devices.

Room (1)

↓

Device (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| room_code | Fast room lookup |
| building_name | Building-wise filtering |
| room_type | Filter classrooms, labs, seminar halls |
| is_active | Retrieve active rooms |

---

## Business Rules

- Every room must have a unique room code.
- Only active rooms can be assigned to timetable entries.
- Attendance sessions can only be conducted in active rooms.
- A room may contain multiple registered Android attendance devices.
- Historical attendance records remain unchanged even if a room is deactivated.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1 |
| room_code | LH101 |
| room_name | Lecture Hall 101 |
| building_name | Academic Block A |
| floor_number | 1 |
| room_type | Classroom |
| capacity | 80 |
| is_active | TRUE |
| created_at | 2026-07-05 09:00:00 |
| updated_at | 2026-07-05 09:00:00 |

---

## Notes

- The Room table is a master table referenced by Timetable, AttendanceSession, and Device.
- Device records should store only the `room_id` foreign key instead of the room name.
- Room information is maintained centrally to ensure consistency throughout the FaceGate system.
- The system supports different room types, including classrooms, laboratories, seminar halls, conference rooms, and auditoriums.

# 12. AcademicCalendar

## Purpose

The **AcademicCalendar** table stores the official academic calendar of the institution.

It defines whether a particular date is a working day, holiday, examination day, semester event, or any other academic event.

The Academic Calendar is used throughout the FaceGate system to determine whether attendance sessions should be generated automatically for a given date.

Instead of hardcoding holidays or working days, the backend references the Academic Calendar to make attendance scheduling dynamic and configurable.

The Academic Calendar is also synchronized with Android devices to ensure attendance is only conducted on valid academic days.

---

## Table Name

academic_calendar

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique calendar entry identifier |
| calendar_date | DATE | UNIQUE, NOT NULL | Academic date |
| day_name | VARCHAR(15) | NOT NULL | Monday, Tuesday, etc. |
| day_type | VARCHAR(30) | NOT NULL | Working Day, Holiday, Exam Day, Event, Weekend |
| event_title | VARCHAR(150) | NULL | Name of the event or holiday |
| event_description | TEXT | NULL | Additional details |
| semester | INTEGER | NULL | Applicable semester |
| academic_year | VARCHAR(20) | NOT NULL | Academic session (e.g., 2026–27) |
| attendance_allowed | BOOLEAN | DEFAULT TRUE | Indicates whether attendance sessions can be generated on this date |
| timetable_override | BOOLEAN | DEFAULT FALSE | Indicates whether the regular timetable is overridden |
| is_active | BOOLEAN | DEFAULT TRUE | Active calendar entry |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Unique Constraints

- calendar_date

---

## Relationships

### AttendanceSession

One academic calendar entry may generate multiple attendance sessions.

AcademicCalendar (1)

↓

AttendanceSession (N)

---

### Holiday

Holiday records reference the academic calendar.

AcademicCalendar (1)

↓

Holiday (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| calendar_date | Fast lookup by date |
| day_type | Filter working days and holidays |
| semester | Semester-specific calendar |
| academic_year | Academic year filtering |
| attendance_allowed | Attendance scheduling |
| timetable_override | Timetable override lookup |

---

## Business Rules

- Every calendar date must be unique.
- Only one calendar entry can exist for a specific date.
- Attendance sessions are generated only when attendance_allowed is TRUE.
- Holidays automatically disable attendance generation.
- Examination days may follow special attendance rules.
- Timetable overrides allow special schedules without modifying the regular timetable.
- Inactive calendar entries are ignored by the scheduling system.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | c12e5a91-8b34-4f0e-9d61-5d6f87d3b2c8 |
| calendar_date | 2026-08-15 |
| day_name | Saturday |
| day_type | Holiday |
| event_title | Independence Day |
| event_description | National Holiday |
| semester | 5 |
| academic_year | 2026–27 |
| attendance_allowed | FALSE |
| timetable_override | FALSE |
| is_active | TRUE |
| created_at | 2026-07-05 09:00:00 |
| updated_at | 2026-07-05 09:00:00 |

---

## Notes

- The Academic Calendar is the authoritative source for determining whether attendance can be conducted on a given date.
- Android devices synchronize Academic Calendar entries during periodic synchronization.
- Timetable generation references the Academic Calendar before creating Attendance Sessions.
- Special events such as examinations, industrial visits, workshops, or college festivals can be represented without changing the regular timetable.
- Timetable overrides allow administrators to replace the regular schedule for a specific date while preserving the weekly timetable.

# 13. Timetable

## Purpose

The **Timetable** table stores the official academic schedule for all classes conducted within the institution.

Each timetable entry represents one scheduled lecture or laboratory session for a specific batch. It defines the subject being taught, the faculty responsible, the classroom, and the day and time of the class.

The Timetable table serves as the primary source for automatically generating Attendance Sessions. Instead of manually creating attendance sessions every day, the system can generate them dynamically based on the timetable.

The table also enables timetable management, attendance scheduling, timetable synchronization with Android devices, and timetable-based analytics.

---

## Table Name

timetable

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the timetable entry |
| department_id | UUID | FOREIGN KEY, NOT NULL | References the Department table |
| batch_id | UUID | FOREIGN KEY, NOT NULL | References the Batch table |
| subject_id | UUID | FOREIGN KEY, NOT NULL | References the Subject table |
| faculty_id | UUID | FOREIGN KEY, NOT NULL | References the Faculty table |
| room_id | UUID | FOREIGN KEY, NOT NULL | References the Room table |
| day_of_week | VARCHAR(15) | NOT NULL | Monday, Tuesday, Wednesday, etc. |
| period_number | INTEGER | NOT NULL | Lecture number during the day |
| start_time | TIME | NOT NULL | Scheduled start time |
| end_time | TIME | NOT NULL | Scheduled end time |
| attendance_window | INTEGER | DEFAULT 10 | Time window (minutes) during which attendance can be marked |
| academic_year | VARCHAR(20) | NOT NULL | Academic session (e.g., 2026–27) |
| semester | INTEGER | NOT NULL | Semester for which the timetable is applicable |
| is_active | BOOLEAN | DEFAULT TRUE | Indicates whether the timetable entry is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Foreign Keys

department_id → department(id)

batch_id → batch(id)

subject_id → subject(id)

faculty_id → faculty(id)

room_id → room(id)

---

## Relationships

### Department

Department (1)

↓

Timetable (N)

---

### Batch

Batch (1)

↓

Timetable (N)

---

### Subject

Subject (1)

↓

Timetable (N)

---

### Faculty

Faculty (1)

↓

Timetable (N)

---

### Room

Room (1)

↓

Timetable (N)

---

### Attendance Session

One timetable entry may generate multiple attendance sessions throughout the semester.

Timetable (1)

↓

AttendanceSession (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| batch_id | Retrieve timetable for a batch |
| faculty_id | Faculty timetable lookup |
| room_id | Room schedule lookup |
| subject_id | Subject-wise timetable |
| day_of_week | Daily schedule |
| start_time | Chronological sorting |
| semester | Semester-wise timetable |
| academic_year | Academic year filtering |
| is_active | Active timetable entries |

---

## Business Rules

- Every timetable entry must belong to an existing department.
- Every timetable entry must be associated with an existing batch.
- Every timetable entry must reference an existing subject.
- Every timetable entry must reference an existing faculty member.
- Every timetable entry must reference an existing room.
- The end time must always be greater than the start time.
- Two timetable entries for the same room cannot overlap.
- A faculty member cannot be assigned to two classes at the same time.
- A batch cannot have two different lectures scheduled at the same time.
- Only active timetable entries are synchronized with Android devices.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | 87d2f1b5-a56c-4d72-bf0d-2f3a98e13d41 |
| department_id | 8a3b2e41-c8b4-4c18-ae9d-7c2f1c8f64a1 |
| batch_id | b2a7d8d3-8f3a-4d6a-b9b4-c62d83b73f11 |
| subject_id | a1d3c5b8-9f7d-42d3-8b1f-5a7e8c6d9b20 |
| faculty_id | 5f91f0d3-7c32-4d3a-a8d1-6b5d8d27e3f1 |
| room_id | 6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1 |
| day_of_week | Monday |
| period_number | 2 |
| start_time | 10:00:00 |
| end_time | 11:00:00 |
| attendance_window | 10 |
| academic_year | 2026-27 |
| semester | 5 |
| is_active | TRUE |
| created_at | 2026-07-05 09:00:00 |
| updated_at | 2026-07-05 09:00:00 |

---

## Notes

- The Timetable table is the primary source for generating Attendance Sessions.
- Android devices synchronize only active timetable entries relevant to their assigned batches.
- Timetable updates are automatically reflected in future attendance sessions.
- Any modification to faculty, room, subject, or batch is reflected automatically through foreign key relationships.
- The system validates timetable conflicts before saving new or updated entries.


# 14. AttendanceSession

## Purpose

The **AttendanceSession** table represents an individual attendance event conducted for a scheduled class.

An Attendance Session is generated automatically from the Timetable based on the Academic Calendar or can be created manually by an authorized administrator in exceptional situations.

Every attendance record belongs to exactly one Attendance Session.

The AttendanceSession table acts as the central reference for attendance collection, attendance synchronization, attendance reports, and attendance analytics.

---

## Table Name

attendance_session

---

## Columns

| Column | Data Type | Constraints | Description |
|---------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier for the attendance session |
| timetable_id | UUID | FOREIGN KEY, NOT NULL | References the timetable entry |
| calendar_id | UUID | FOREIGN KEY, NOT NULL | References the academic calendar date |
| department_id | UUID | FOREIGN KEY, NOT NULL | References Department |
| batch_id | UUID | FOREIGN KEY, NOT NULL | References Batch |
| subject_id | UUID | FOREIGN KEY, NOT NULL | References Subject |
| faculty_id | UUID | FOREIGN KEY, NOT NULL | References Faculty |
| room_id | UUID | FOREIGN KEY, NOT NULL | References Room |
| session_date | DATE | NOT NULL | Date on which attendance is conducted |
| start_time | TIME | NOT NULL | Actual session start time |
| end_time | TIME | NOT NULL | Actual session end time |
| attendance_window | INTEGER | DEFAULT 10 | Time (minutes) during which attendance can be marked |
| session_status | VARCHAR(20) | DEFAULT 'ACTIVE' | ACTIVE, COMPLETED, CANCELLED |
| attendance_mode | VARCHAR(20) | DEFAULT 'FACE_RECOGNITION' | FACE_RECOGNITION, MANUAL, HYBRID |
| total_students | INTEGER | DEFAULT 0 | Number of students expected |
| total_present | INTEGER | DEFAULT 0 | Number of students marked present |
| total_absent | INTEGER | DEFAULT 0 | Number of students absent |
| created_by | VARCHAR(100) | NOT NULL | Administrator or Faculty who created the session |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp |

---

## Primary Key

id

---

## Foreign Keys

timetable_id → timetable(id)

calendar_id → academic_calendar(id)

department_id → department(id)

batch_id → batch(id)

subject_id → subject(id)

faculty_id → faculty(id)

room_id → room(id)

---

## Relationships

### Timetable

One timetable entry can generate multiple attendance sessions.

Timetable (1)

↓

AttendanceSession (N)

---

### Academic Calendar

One academic calendar entry can contain multiple attendance sessions.

AcademicCalendar (1)

↓

AttendanceSession (N)

---

### Attendance

One attendance session contains multiple attendance records.

AttendanceSession (1)

↓

Attendance (N)

---

### Batch

One batch can have multiple attendance sessions.

Batch (1)

↓

AttendanceSession (N)

---

### Faculty

One faculty member can conduct multiple attendance sessions.

Faculty (1)

↓

AttendanceSession (N)

---

### Subject

One subject can have multiple attendance sessions.

Subject (1)

↓

AttendanceSession (N)

---

### Room

One room can host multiple attendance sessions.

Room (1)

↓

AttendanceSession (N)

---

## Indexes

| Index | Purpose |
|--------|---------|
| timetable_id | Fast timetable lookup |
| session_date | Daily attendance lookup |
| batch_id | Batch-wise attendance |
| faculty_id | Faculty-wise attendance |
| subject_id | Subject-wise attendance |
| room_id | Room-wise attendance |
| session_status | Retrieve active sessions |
| attendance_mode | Filter by attendance mode |

---

## Business Rules

- Every attendance session must be linked to an existing timetable entry.
- Attendance sessions can only be created for valid working days in the Academic Calendar.
- Attendance cannot be marked after the attendance window expires.
- Cancelled sessions cannot accept attendance records.
- Completed sessions become read-only.
- Every attendance record must belong to one valid attendance session.
- Android devices synchronize only ACTIVE attendance sessions.

---

## Sample Record

| Column | Value |
|---------|-------|
| id | d83b1c9d-7e54-4b8b-98b4-4c8d3e91f123 |
| timetable_id | 87d2f1b5-a56c-4d72-bf0d-2f3a98e13d41 |
| calendar_id | c12e5a91-8b34-4f0e-9d61-5d6f87d3b2c8 |
| department_id | 8a3b2e41-c8b4-4c18-ae9d-7c2f1c8f64a1 |
| batch_id | b2a7d8d3-8f3a-4d6a-b9b4-c62d83b73f11 |
| subject_id | a1d3c5b8-9f7d-42d3-8b1f-5a7e8c6d9b20 |
| faculty_id | 5f91f0d3-7c32-4d3a-a8d1-6b5d8d27e3f1 |
| room_id | 6f31bca2-fc92-4d84-bcc8-5c0d8d7a22c1 |
| session_date | 2026-07-15 |
| start_time | 10:00 |
| end_time | 11:00 |
| attendance_window | 10 |
| session_status | ACTIVE |
| attendance_mode | FACE_RECOGNITION |
| total_students | 72 |
| total_present | 0 |
| total_absent | 0 |
| created_by | Admin |
| created_at | 2026-07-15 09:50:00 |
| updated_at | 2026-07-15 09:50:00 |

---

## Notes

- Attendance Sessions are generated automatically from the Timetable after validating the Academic Calendar.
- Attendance Sessions are synchronized to Android devices before the class begins.
- Each Attendance Session acts as the parent record for all attendance entries collected during that class.
- Once the session is marked COMPLETED, no further attendance modifications are allowed unless performed by an administrator.
- Attendance statistics (present, absent, percentage) are calculated using the Attendance table associated with the session.
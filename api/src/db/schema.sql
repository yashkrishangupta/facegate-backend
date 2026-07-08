-- ==========================================================
-- FaceGate Attendance Management System
-- Database: PostgreSQL
-- Version : 1.0
-- Author  : FaceGate Team
-- ==========================================================

-- ==========================================================
-- Enable UUID Generation
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- Drop Existing Tables (Development Only)
-- ==========================================================

DROP TABLE IF EXISTS change_log CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS conflict CASCADE;
DROP TABLE IF EXISTS device_sync_log CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS attendance_session CASCADE;
DROP TABLE IF EXISTS face_embedding CASCADE;
DROP TABLE IF EXISTS device CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS holiday CASCADE;
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS subject CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS batch CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS academic_calendar CASCADE;
DROP TABLE IF EXISTS admin_user CASCADE;

-- ==========================================================
-- TABLE: Department
-- Description: Stores academic departments.
-- ==========================================================

CREATE TABLE department (

    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    department_code VARCHAR(10) NOT NULL UNIQUE,

    department_name VARCHAR(100) NOT NULL UNIQUE,

    hod_name VARCHAR(100),

    email VARCHAR(100),

    phone VARCHAR(15),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_department_email
        CHECK (
            email IS NULL
            OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )
);
-- ==========================================================
-- TABLE: Batch
-- Description: Stores batch and section information.
-- ==========================================================

CREATE TABLE batch (

    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    department_id UUID NOT NULL,

    batch_code VARCHAR(20) NOT NULL UNIQUE,

    program VARCHAR(20) NOT NULL,

    academic_year VARCHAR(9) NOT NULL,

    semester INTEGER NOT NULL,

    section VARCHAR(5) NOT NULL,

    strength INTEGER NOT NULL,

    batch_advisor_id UUID,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_batch_department
        FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,          

    CONSTRAINT chk_program
        CHECK (
            program IN (
                'B.Tech',
                'M.Tech',
                'PhD',
                'MBA',
                'MCA'
            )
        ),

    CONSTRAINT chk_semester
        CHECK (
            semester BETWEEN 1 AND 8
        ),

    CONSTRAINT chk_strength
        CHECK (
            strength > 0
        )

);

-- ==========================================================
-- TABLE: Faculty
-- Description: Stores faculty information.
-- ==========================================================

CREATE TABLE faculty (

    faculty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    department_id UUID NOT NULL,

    employee_id VARCHAR(20) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    last_name VARCHAR(50) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    phone VARCHAR(15),

    designation VARCHAR(50) NOT NULL,

    specialization VARCHAR(100),

    joining_date DATE,

    office_location VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_faculty_department
        FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_faculty_email
        CHECK (
            email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )

);
ALTER TABLE batch
ADD CONSTRAINT fk_batch_advisor
FOREIGN KEY (batch_advisor_id)
REFERENCES faculty(faculty_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ==========================================================
-- TABLE: Subject
-- Description: Stores subject/course information.
-- ==========================================================

CREATE TABLE subject (

    subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    department_id UUID NOT NULL,

    subject_code VARCHAR(20) NOT NULL UNIQUE,

    subject_name VARCHAR(100) NOT NULL,

    program VARCHAR(20) NOT NULL,

    semester INTEGER NOT NULL,

    credits INTEGER NOT NULL,

    subject_type VARCHAR(20) NOT NULL,

    course_category VARCHAR(20) NOT NULL DEFAULT 'Core',

    contact_hours_per_week INTEGER NOT NULL,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_subject_department
        FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_course_category
    CHECK (
        course_category IN (
            'Core',
            'Elective',
            'Open Elective'
        )
    ),    

    CONSTRAINT chk_subject_program
        CHECK (
            program IN (
                'B.Tech',
                'M.Tech',
                'PhD',
                'MBA',
                'MCA'
            )
        ),

    CONSTRAINT chk_subject_semester
        CHECK (
            semester BETWEEN 1 AND 8
        ),

    CONSTRAINT chk_subject_type
        CHECK (
            subject_type IN (
                'Theory',
                'Lab',
                'Tutorial'
            )
        ),

    CONSTRAINT chk_subject_credits
        CHECK (
            credits > 0
        ),

    CONSTRAINT chk_contact_hours
        CHECK (
            contact_hours_per_week > 0
        )

);
-- ==========================================================
-- TABLE: Room
-- Description: Stores classroom, laboratory, and seminar room information.
-- ==========================================================

CREATE TABLE room (

    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_number VARCHAR(20) NOT NULL UNIQUE,

    room_name VARCHAR(100),

    building_name VARCHAR(100) NOT NULL,

    floor_number INTEGER,

    room_type VARCHAR(30) NOT NULL,

    capacity INTEGER NOT NULL,

    has_projector BOOLEAN DEFAULT FALSE,

    has_wifi BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_room_type
        CHECK (
            room_type IN (
                'Lecture Hall',
                'Laboratory',
                'Seminar Hall',
                'Tutorial Room',
                'Conference Room'
            )
        ),

    CONSTRAINT chk_room_capacity
        CHECK (
            capacity > 0
        )

);
-- ==========================================================
-- TABLE: Academic Calendar
-- Description: Stores working days, holidays, semester schedule,
--              and academic events.
-- ==========================================================

CREATE TABLE academic_calendar (

    calendar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    calendar_date DATE NOT NULL UNIQUE,

    academic_year VARCHAR(9) NOT NULL,

    semester INTEGER NOT NULL,

   

    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,

    event_type VARCHAR(30) NOT NULL DEFAULT 'WORKING_DAY',

    event_name VARCHAR(100),

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_calendar_semester
        CHECK (
            semester BETWEEN 1 AND 8
        ),


    CONSTRAINT chk_event_type
        CHECK (
            event_type IN (
                'WORKING_DAY',
                'HOLIDAY',
                'EXAM',
                'VACATION',
                'EVENT'
            )
        )

);

-- ==========================================================
-- TABLE: Student
-- Description: Stores student information.
-- ==========================================================

CREATE TABLE student (

    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    batch_id UUID NOT NULL,

    registration_number VARCHAR(20) NOT NULL UNIQUE,

    roll_number VARCHAR(20) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    last_name VARCHAR(50) NOT NULL,

    email VARCHAR(100) UNIQUE,

    phone VARCHAR(15),

    gender VARCHAR(10) NOT NULL,

    date_of_birth DATE,

    admission_year INTEGER NOT NULL,

    profile_photo_url TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    student_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_student_batch
        FOREIGN KEY (batch_id)
        REFERENCES batch(batch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_student_gender
        CHECK (
            gender IN (
                'Male',
                'Female',
                'Other'
            )
        ),

    CONSTRAINT chk_admission_year
        CHECK (
            admission_year >= 2000
        ),

    CONSTRAINT chk_student_email
        CHECK (
            email IS NULL
            OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        ),

    CONSTRAINT chk_student_status
CHECK (
    student_status IN (
        'ACTIVE',
        'GRADUATED',
        'SUSPENDED',
        'DROPPED'
    )
)   

);

-- ==========================================================
-- TABLE: Timetable
-- Description: Stores class schedule information.
-- ==========================================================

CREATE TABLE timetable (

    timetable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    batch_id UUID NOT NULL,

    faculty_id UUID NOT NULL,

    subject_id UUID NOT NULL,

    room_id UUID NOT NULL,

    day_of_week VARCHAR(10) NOT NULL,

    lecture_number INTEGER NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    attendance_window_minutes INTEGER NOT NULL DEFAULT 10,

    effective_from DATE NOT NULL,

    effective_to DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_timetable_batch
        FOREIGN KEY (batch_id)
        REFERENCES batch(batch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_timetable_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculty(faculty_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_timetable_subject
        FOREIGN KEY (subject_id)
        REFERENCES subject(subject_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_timetable_room
        FOREIGN KEY (room_id)
        REFERENCES room(room_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_day_of_week
        CHECK (
            day_of_week IN (
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            )
        ),

    CONSTRAINT chk_lecture_number
        CHECK (
            lecture_number > 0
        ),

    CONSTRAINT chk_attendance_window
        CHECK (
            attendance_window_minutes BETWEEN 1 AND 60
        ),

    CONSTRAINT chk_time
        CHECK (
            start_time < end_time
        ),

    CONSTRAINT uq_timetable_slot
UNIQUE (
    batch_id,
    day_of_week,
    lecture_number
)
);

-- ==========================================================
-- TABLE: Attendance Session
-- Description: Stores every attendance session generated
--              from the timetable.
-- ==========================================================

CREATE TABLE attendance_session (

    attendance_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    timetable_id UUID NOT NULL,

    session_date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    session_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',

    attendance_window_start TIMESTAMP,

    attendance_window_end TIMESTAMP,

    total_students INTEGER DEFAULT 0,

    present_students INTEGER DEFAULT 0,

    absent_students INTEGER DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    attendance_mode VARCHAR(20)
NOT NULL DEFAULT 'FACE_RECOGNITION',

    CONSTRAINT chk_session_status
        CHECK (
            session_status IN (
                'SCHEDULED',
                'ACTIVE',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_attendance_mode
CHECK (
    attendance_mode IN (
        'FACE_RECOGNITION',
        'MANUAL',
        'HYBRID'
    )
),    

    CONSTRAINT chk_student_counts
        CHECK (
            total_students >= 0
            AND present_students >= 0
            AND absent_students >= 0
            AND present_students <= total_students
            AND absent_students <= total_students
        ),

    CONSTRAINT chk_session_time
        CHECK (
            start_time < end_time
        ),
    CONSTRAINT uq_session_per_day
UNIQUE (
    timetable_id,
    session_date
)    

);
-- ==========================================================
-- TABLE: Device
-- Description: Stores registered FaceGate Android devices.
-- ==========================================================

CREATE TABLE device (

    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id UUID NOT NULL,

    device_identifier VARCHAR(100) NOT NULL UNIQUE,

    device_name VARCHAR(100) NOT NULL,

    device_type VARCHAR(30) NOT NULL DEFAULT 'ANDROID_TABLET',

    app_version VARCHAR(20) NOT NULL,

    operating_system VARCHAR(50),

    device_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_heartbeat TIMESTAMP,

    last_sync TIMESTAMP,

    battery_percentage INTEGER,

    storage_available_mb INTEGER,

    network_status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',

    device_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_device_room
        FOREIGN KEY (room_id)
        REFERENCES room(room_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_device_type
        CHECK (
            device_type IN (
                'ANDROID_TABLET',
                'ANDROID_PHONE'
            )
        ),

    CONSTRAINT chk_network_status
        CHECK (
            network_status IN (
                'ONLINE',
                'OFFLINE'
            )
        ),

    CONSTRAINT chk_device_status
        CHECK (
            device_status IN (
                'ACTIVE',
                'INACTIVE',
                'MAINTENANCE',
                'LOST'
            )
        ),

    CONSTRAINT chk_battery
        CHECK (
            battery_percentage IS NULL
            OR (
                battery_percentage >= 0
                AND battery_percentage <= 100
            )
        ),

    CONSTRAINT chk_storage
        CHECK (
            storage_available_mb IS NULL
            OR storage_available_mb >= 0
        )

);



-- ==========================================================
-- TABLE: Attendance
-- Description: Stores attendance records for each student
--              in an attendance session.
-- ==========================================================

CREATE TABLE attendance (

    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attendance_session_id UUID NOT NULL,

    student_id UUID NOT NULL,

    device_id UUID,

    attendance_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',

    attendance_mode VARCHAR(20) NOT NULL DEFAULT 'FACE_RECOGNITION',

    recognition_confidence DECIMAL(5,2),

    attendance_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    remarks TEXT,

    verification_status VARCHAR(20)
NOT NULL DEFAULT 'VERIFIED',

    synced BOOLEAN NOT NULL DEFAULT FALSE,

    synced_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_attendance_session
        FOREIGN KEY (attendance_session_id)
        REFERENCES attendance_session(attendance_session_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_attendance_device
        FOREIGN KEY (device_id)
        REFERENCES device(device_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_attendance_status
        CHECK (
            attendance_status IN (
                'PRESENT',
                'ABSENT',
                'LATE',
                'EXCUSED'
            )
        ),
    CONSTRAINT chk_attendance_mode
        CHECK (
            attendance_mode IN (
                'FACE_RECOGNITION',
                'MANUAL',
                'HYBRID'
            )
        ),

    CONSTRAINT chk_confidence
        CHECK (
            recognition_confidence IS NULL
            OR (
                recognition_confidence >= 0
                AND recognition_confidence <= 100
            )
        ),

    CONSTRAINT uq_student_session
        UNIQUE (
            attendance_session_id,
            student_id
        ),

    CONSTRAINT chk_verification_status
        CHECK (
            verification_status IN (
                'VERIFIED',
                'PENDING',
                'REJECTED'
            )
        )

);

-- ==========================================================
-- TABLE: Face Embedding
-- Description: Stores AI-generated face embeddings for students.
-- ==========================================================

CREATE TABLE face_embedding (

    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL,

    embedding_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',

    embedding_data JSONB NOT NULL,

    model_name VARCHAR(100) NOT NULL,

    confidence_threshold DECIMAL(5,2) NOT NULL DEFAULT 75.00,

    embedding_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    enrolled_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_embedding_student
        FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_student_embedding
        UNIQUE(student_id),

    CONSTRAINT chk_embedding_status
        CHECK (
            embedding_status IN (
                'ACTIVE',
                'INACTIVE',
                'REVOKED'
            )
        ),

    CONSTRAINT chk_confidence_threshold
        CHECK (
            confidence_threshold BETWEEN 0 AND 100
        )

);

-- ==========================================================
-- TABLE: Device Sync Log
-- Description: Stores synchronization history of Android devices.
-- ==========================================================

CREATE TABLE device_sync_log (

    sync_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    device_id UUID NOT NULL,

    sync_type VARCHAR(30) NOT NULL,

    sync_status VARCHAR(20) NOT NULL,

    sync_start_time TIMESTAMP NOT NULL,

    sync_end_time TIMESTAMP,

    records_uploaded INTEGER NOT NULL DEFAULT 0,

    records_downloaded INTEGER NOT NULL DEFAULT 0,

    failed_records INTEGER NOT NULL DEFAULT 0,

    error_message TEXT,

    app_version VARCHAR(20),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_sync_device
        FOREIGN KEY (device_id)
        REFERENCES device(device_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_sync_type
        CHECK (
            sync_type IN (
                'FULL',
                'INCREMENTAL',
                'ATTENDANCE_UPLOAD',
                'HEARTBEAT',
                'HOLIDAY_SYNC',
                'TIMETABLE_SYNC',
                'STUDENT_SYNC',
                'FACE_SYNC'
            )
        ),

    CONSTRAINT chk_sync_status
        CHECK (
            sync_status IN (
                'SUCCESS',
                'FAILED',
                'PARTIAL',
                'IN_PROGRESS'
            )
        ),

    CONSTRAINT chk_uploaded
        CHECK (records_uploaded >= 0),

    CONSTRAINT chk_downloaded
        CHECK (records_downloaded >= 0),

    CONSTRAINT chk_failed
        CHECK (failed_records >= 0)

);

-- ==========================================================
-- TABLE: Holiday
-- Description: Stores holiday information.
-- ==========================================================

CREATE TABLE holiday (

    holiday_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    calendar_id UUID NOT NULL,

    holiday_name VARCHAR(100) NOT NULL,

    holiday_type VARCHAR(30) NOT NULL,

    description TEXT,

    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,

    created_by UUID,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_holiday_calendar
        FOREIGN KEY (calendar_id)
        REFERENCES academic_calendar(calendar_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,    

    CONSTRAINT chk_holiday_type
        CHECK (
            holiday_type IN (
                'NATIONAL',
                'INSTITUTIONAL',
                'FESTIVAL',
                'EMERGENCY',
                'GAZETTED'
            )
        )

);

-- ==========================================================
-- TABLE: Notification
-- Description: Stores system and administrator notifications.
-- ==========================================================

CREATE TABLE notification (

    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    admin_id UUID,

    title VARCHAR(150) NOT NULL,

    message TEXT NOT NULL,

    notification_type VARCHAR(30) NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMP,

    created_by UUID,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT chk_notification_type
        CHECK (
            notification_type IN (
                'SYSTEM',
                'ATTENDANCE',
                'DEVICE',
                'CONFLICT',
                'SYNC',
                'HOLIDAY',
                'TIMETABLE',
                'SECURITY',
                'ANNOUNCEMENT'
            )
        ),

    CONSTRAINT chk_priority
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        )

);

-- ==========================================================
-- TABLE: Conflict
-- Description: Stores attendance and synchronization conflicts.
-- ==========================================================

CREATE TABLE conflict (

    conflict_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attendance_id UUID,

    attendance_session_id UUID NOT NULL,

    student_id UUID,

    device_id UUID,

    conflict_type VARCHAR(30) NOT NULL,

    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    conflict_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    description TEXT,

    resolution_notes TEXT,

    resolved_by UUID,

    resolved_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_conflict_attendance
        FOREIGN KEY (attendance_id)
        REFERENCES attendance(attendance_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_conflict_session
        FOREIGN KEY (attendance_session_id)
        REFERENCES attendance_session(attendance_session_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_conflict_student
        FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_conflict_device
        FOREIGN KEY (device_id)
        REFERENCES device(device_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_conflict_type
        CHECK (
            conflict_type IN (
                'LOW_CONFIDENCE',
                'DUPLICATE_ATTENDANCE',
                'SYNC_FAILURE',
                'MANUAL_REVIEW',
                'DEVICE_ERROR',
                'UNKNOWN_FACE'
            )
        ),

    CONSTRAINT chk_conflict_severity
        CHECK (
            severity IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    CONSTRAINT chk_conflict_status
        CHECK (
            conflict_status IN (
                'PENDING',
                'UNDER_REVIEW',
                'RESOLVED',
                'REJECTED'
            )
        )
    -- fk_conflict_resolved_by added later via ALTER TABLE, once admin_user exists

);

-- ==========================================================
-- TABLE: Admin User
-- Description: Stores administrator accounts for FaceGate.
-- ==========================================================

CREATE TABLE admin_user (

    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id VARCHAR(20) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    last_name VARCHAR(50) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',

    phone VARCHAR(15),

    last_login TIMESTAMP,

    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_admin_role
        CHECK (
            role IN (
                'SUPER_ADMIN',
                'ADMIN',
                'FACULTY',
                'VIEWER'
            )
        ),

    CONSTRAINT chk_account_status
        CHECK (
            account_status IN (
                'ACTIVE',
                'LOCKED',
                'SUSPENDED',
                'DISABLED'
            )
        ),

    CONSTRAINT chk_failed_attempts
        CHECK (
            failed_login_attempts >= 0
        ),

    CONSTRAINT chk_admin_email
        CHECK (
            email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )

);
ALTER TABLE holiday
ADD CONSTRAINT fk_holiday_admin
FOREIGN KEY (created_by)
REFERENCES admin_user(admin_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE notification
ADD CONSTRAINT fk_notification_admin
FOREIGN KEY (admin_id)
REFERENCES admin_user(admin_id);

ALTER TABLE notification
ADD CONSTRAINT fk_notification_creator
FOREIGN KEY (created_by)
REFERENCES admin_user(admin_id);

ALTER TABLE conflict
ADD CONSTRAINT fk_conflict_resolved_by
FOREIGN KEY (resolved_by)
REFERENCES admin_user(admin_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ==========================================================
-- TABLE: Change Log
-- Description: Stores audit logs for all important system actions.
-- ==========================================================

CREATE TABLE change_log (

    change_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    admin_id UUID,

    entity_name VARCHAR(50) NOT NULL,

    entity_id UUID,

    action VARCHAR(20) NOT NULL,

    old_values JSONB,

    new_values JSONB,

    ip_address VARCHAR(45),

    user_agent TEXT,

    action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_change_log_admin
        FOREIGN KEY (admin_id)
        REFERENCES admin_user(admin_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_action
        CHECK (
            action IN (
                'CREATE',
                'UPDATE',
                'DELETE',
                'LOGIN',
                'LOGOUT',
                'SYNC',
                'RESOLVE',
                'EXPORT'
            )
        )

);

-- ==========================================================
-- INDEXES
-- ==========================================================

-- Department
CREATE INDEX idx_department_code
ON department(department_code);

-- Batch
CREATE INDEX idx_batch_department
ON batch(department_id);

CREATE INDEX idx_batch_code
ON batch(batch_code);

-- Faculty
CREATE INDEX idx_faculty_department
ON faculty(department_id);

CREATE INDEX idx_faculty_employee
ON faculty(employee_id);

-- Subject
CREATE INDEX idx_subject_department
ON subject(department_id);

CREATE INDEX idx_subject_code
ON subject(subject_code);

-- Student
CREATE INDEX idx_student_batch
ON student(batch_id);

CREATE INDEX idx_student_roll
ON student(roll_number);

CREATE INDEX idx_student_registration
ON student(registration_number);

-- Timetable
CREATE INDEX idx_timetable_batch
ON timetable(batch_id);

CREATE INDEX idx_timetable_faculty
ON timetable(faculty_id);

CREATE INDEX idx_timetable_room
ON timetable(room_id);

-- Attendance Session
CREATE INDEX idx_session_date
ON attendance_session(session_date);

CREATE INDEX idx_session_timetable
ON attendance_session(timetable_id);

-- Attendance
CREATE INDEX idx_attendance_student
ON attendance(student_id);

CREATE INDEX idx_attendance_session
ON attendance(attendance_session_id);

CREATE INDEX idx_attendance_time
ON attendance(attendance_time);

-- Face Embedding
CREATE INDEX idx_embedding_student
ON face_embedding(student_id);

-- Device
CREATE INDEX idx_device_room
ON device(room_id);

CREATE INDEX idx_device_identifier
ON device(device_identifier);

-- Device Sync Log
CREATE INDEX idx_sync_device
ON device_sync_log(device_id);

CREATE INDEX idx_sync_time
ON device_sync_log(sync_start_time);

-- Holiday
CREATE INDEX idx_holiday_calendar
ON holiday(calendar_id);

-- Notification
CREATE INDEX idx_notification_admin
ON notification(admin_id);

CREATE INDEX idx_notification_read
ON notification(is_read);

-- Conflict
CREATE INDEX idx_conflict_status
ON conflict(conflict_status);

CREATE INDEX idx_conflict_student
ON conflict(student_id);

-- Change Log
CREATE INDEX idx_change_admin
ON change_log(admin_id);

CREATE INDEX idx_change_entity
ON change_log(entity_name);
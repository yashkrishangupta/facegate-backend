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

    CONSTRAINT fk_batch_advisor
    FOREIGN KEY (batch_advisor_id)
    REFERENCES faculty(faculty_id)
    ON DELETE SET NULL
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

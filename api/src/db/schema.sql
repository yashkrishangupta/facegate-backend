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

    current_semester INTEGER NOT NULL,

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

    CONSTRAINT chk_student_semester
        CHECK (
            current_semester BETWEEN 1 AND 8
        ),

    CONSTRAINT chk_admission_year
        CHECK (
            admission_year >= 2000
        ),

    CONSTRAINT chk_student_email
        CHECK (
            email IS NULL
            OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )

    CONSTRAINT chk_student_status
CHECK (
    student_status IN (
        'ACTIVE',
        'GRADUATED',
        'SUSPENDED',
        'DROPPED'
    )
),    

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
        )

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


    CONSTRAINT fk_session_calendar
        FOREIGN KEY (calendar_id)
        REFERENCES academic_calendar(calendar_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

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
        )
    CONSTRAINT uq_session_per_day
UNIQUE (
    timetable_id,
    session_date
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
        )
    CONSTRAINT uq_student_session
UNIQUE (
    attendance_session_id,
    student_id
)   
CONSTRAINT chk_verification_status
CHECK (
    verification_status IN (
        'VERIFIED',
        'PENDING',
        'REJECTED'
    )
), 

);
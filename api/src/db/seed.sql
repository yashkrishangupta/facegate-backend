-- ==========================================================
-- FaceGate Attendance Management System
-- Seed Data (Development Only)
-- Run AFTER schema.sql. Assumes tables are empty (schema.sql
-- already drops/recreates everything, so this is safe on a
-- fresh dev database).
-- ==========================================================

BEGIN;

-- ==========================================================
-- ADMIN USERS
-- ==========================================================

INSERT INTO admin_user
    (admin_id, employee_id, first_name, last_name, email, password_hash, role, phone, account_status)
VALUES
    ('00000003-0000-0000-0000-000000000003', 'ADM001', 'Aarav',  'Sharma', 'aarav.sharma@facegate.edu',  '$2b$12$devSeedHashPlaceholder0000000000000000000001', 'SUPER_ADMIN', '9990000001', 'ACTIVE'),
    ('00000004-0000-0000-0000-000000000004', 'ADM002', 'Priya',  'Nair',   'priya.nair@facegate.edu',    '$2b$12$devSeedHashPlaceholder0000000000000000000002', 'ADMIN',       '9990000002', 'ACTIVE');

-- ==========================================================
-- DEPARTMENT
-- ==========================================================

INSERT INTO department
    (department_id, department_code, department_name, hod_name, email, phone)
VALUES
    ('00000014-0000-0000-0000-000000000014', 'CSE', 'Computer Science and Engineering', 'Dr. Ramesh Iyer', 'hod.cse@facegate.edu', '9880000001'),
    ('00000015-0000-0000-0000-000000000015', 'ECE', 'Electronics and Communication Engineering', 'Dr. Sunita Rao', 'hod.ece@facegate.edu', '9880000002'),
    ('00000016-0000-0000-0000-000000000016', 'ME',  'Mechanical Engineering', 'Dr. Vikram Desai', 'hod.me@facegate.edu', '9880000003');

-- ==========================================================
-- FACULTY
-- ==========================================================

INSERT INTO faculty
    (faculty_id, department_id, employee_id, first_name, last_name, email, phone, designation, specialization, joining_date, office_location)
VALUES
    ('00000024-0000-0000-0000-000000000024', '00000014-0000-0000-0000-000000000014', 'FAC001', 'Neha',   'Kapoor', 'neha.kapoor@facegate.edu',  '9770000001', 'Associate Professor', 'Data Structures & Algorithms', '2015-07-01', 'CSE Block, Room 210'),
    ('00000025-0000-0000-0000-000000000025', '00000014-0000-0000-0000-000000000014', 'FAC002', 'Rohit',  'Verma',  'rohit.verma@facegate.edu',  '9770000002', 'Assistant Professor', 'Operating Systems',           '2019-01-15', 'CSE Block, Room 212'),
    ('00000026-0000-0000-0000-000000000026', '00000015-0000-0000-0000-000000000015', 'FAC003', 'Meera',  'Pillai', 'meera.pillai@facegate.edu', '9770000003', 'Professor',           'Signal Processing',           '2010-06-20', 'ECE Block, Room 105'),
    ('00000027-0000-0000-0000-000000000027', '00000016-0000-0000-0000-000000000016', 'FAC004', 'Arjun',  'Mehta',  'arjun.mehta@facegate.edu',  '9770000004', 'Assistant Professor', 'Thermodynamics',              '2020-08-10', 'ME Block, Room 301');

-- ==========================================================
-- BATCH
-- ==========================================================

INSERT INTO batch
    (batch_id, department_id, batch_code, program, academic_year, semester, section, strength, batch_advisor_id)
VALUES
    ('0000000b-0000-0000-0000-00000000000b', '00000014-0000-0000-0000-000000000014', 'CSE-2024-S3-A', 'B.Tech', '2024-2025', 3, 'A', 60, '00000024-0000-0000-0000-000000000024'),
    ('0000000c-0000-0000-0000-00000000000c', '00000014-0000-0000-0000-000000000014', 'CSE-2024-S3-B', 'B.Tech', '2024-2025', 3, 'B', 58, '00000025-0000-0000-0000-000000000025'),
    ('0000000d-0000-0000-0000-00000000000d', '00000015-0000-0000-0000-000000000015', 'ECE-2023-S5-A', 'B.Tech', '2023-2024', 5, 'A', 55, '00000026-0000-0000-0000-000000000026');

-- ==========================================================
-- SUBJECT
-- ==========================================================

INSERT INTO subject
    (subject_id, department_id, subject_code, subject_name, program, semester, credits, subject_type, course_category, contact_hours_per_week, description)
VALUES
    ('0000002e-0000-0000-0000-00000000002e', '00000014-0000-0000-0000-000000000014', 'CSE301', 'Data Structures',          'B.Tech', 3, 4, 'Theory', 'Core', 4, 'Core data structures and algorithm design'),
    ('0000002f-0000-0000-0000-00000000002f', '00000014-0000-0000-0000-000000000014', 'CSE302', 'Data Structures Lab',      'B.Tech', 3, 2, 'Lab',    'Core', 3, 'Hands-on lab for CSE301'),
    ('00000030-0000-0000-0000-000000000030', '00000014-0000-0000-0000-000000000014', 'CSE303', 'Operating Systems',        'B.Tech', 3, 4, 'Theory', 'Core', 4, 'Process management, memory, and file systems'),
    ('00000031-0000-0000-0000-000000000031', '00000015-0000-0000-0000-000000000015', 'ECE501', 'Signals and Systems',      'B.Tech', 5, 4, 'Theory', 'Core', 4, 'Continuous and discrete-time signal analysis');

-- ==========================================================
-- ROOM
-- ==========================================================

INSERT INTO room
    (room_id, room_number, room_name, building_name, floor_number, room_type, capacity, has_projector, has_wifi)
VALUES
    ('0000002b-0000-0000-0000-00000000002b', 'CB-101', 'Lecture Hall 1', 'Central Block',  1, 'Lecture Hall', 70, TRUE,  TRUE),
    ('0000002c-0000-0000-0000-00000000002c', 'CB-201', 'CS Lab 2',       'Central Block',  2, 'Laboratory',   40, TRUE,  TRUE),
    ('0000002d-0000-0000-0000-00000000002d', 'CB-305', 'Seminar Hall A', 'Central Block',  3, 'Seminar Hall', 100, TRUE, TRUE);

-- ==========================================================
-- ACADEMIC CALENDAR
-- ==========================================================

INSERT INTO academic_calendar
    (calendar_id, calendar_date, academic_year, semester, is_working_day, event_type, event_name, description)
VALUES
    ('0000000e-0000-0000-0000-00000000000e', '2026-07-13', '2026-2027', 3, TRUE,  'WORKING_DAY', NULL, NULL),
    ('0000000f-0000-0000-0000-00000000000f', '2026-07-14', '2026-2027', 3, TRUE,  'WORKING_DAY', NULL, NULL),
    ('00000010-0000-0000-0000-000000000010', '2026-08-15', '2026-2027', 3, FALSE, 'HOLIDAY', 'Independence Day', 'National holiday');

-- ==========================================================
-- STUDENT
-- ==========================================================

INSERT INTO student
    (student_id, batch_id, registration_number, roll_number, first_name, last_name, email, phone, gender, date_of_birth, admission_year, student_status)
VALUES
    ('0000001a-0000-0000-0000-00000000001a', '0000000b-0000-0000-0000-00000000000b', 'REG2024CSE001', 'CSE24A01', 'Ananya', 'Gupta',  'ananya.gupta@student.facegate.edu',  '9660000001', 'Female', '2006-03-12', 2024, 'ACTIVE'),
    ('0000001b-0000-0000-0000-00000000001b', '0000000b-0000-0000-0000-00000000000b', 'REG2024CSE002', 'CSE24A02', 'Kabir',  'Singh',  'kabir.singh@student.facegate.edu',   '9660000002', 'Male',   '2006-05-22', 2024, 'ACTIVE'),
    ('0000001c-0000-0000-0000-00000000001c', '0000000c-0000-0000-0000-00000000000c', 'REG2024CSE003', 'CSE24B01', 'Sneha',  'Joshi',  'sneha.joshi@student.facegate.edu',   '9660000003', 'Female', '2006-01-30', 2024, 'ACTIVE'),
    ('0000001d-0000-0000-0000-00000000001d', '0000000c-0000-0000-0000-00000000000c', 'REG2024CSE004', 'CSE24B02', 'Dev',    'Patel',  'dev.patel@student.facegate.edu',     '9660000004', 'Male',   '2006-09-18', 2024, 'ACTIVE'),
    ('0000001e-0000-0000-0000-00000000001e', '0000000d-0000-0000-0000-00000000000d', 'REG2023ECE001', 'ECE23A01', 'Ishita', 'Bose',   'ishita.bose@student.facegate.edu',   '9660000005', 'Female', '2005-11-02', 2023, 'ACTIVE'),
    ('0000001f-0000-0000-0000-00000000001f', '0000000d-0000-0000-0000-00000000000d', 'REG2023ECE002', 'ECE23A02', 'Yash',   'Kulkarni','yash.kulkarni@student.facegate.edu','9660000006', 'Male',   '2005-07-14', 2023, 'ACTIVE');

-- ==========================================================
-- FACE EMBEDDING
-- ==========================================================

INSERT INTO face_embedding
    (embedding_id, student_id, embedding_version, embedding_data, model_name, confidence_threshold, embedding_status)
VALUES
    ('00000020-0000-0000-0000-000000000020', '0000001a-0000-0000-0000-00000000001a', 'v1.0', '{"vector": [0.011, 0.084, 0.132]}', 'ArcFace-R100', 80.00, 'ACTIVE'),
    ('00000021-0000-0000-0000-000000000021', '0000001b-0000-0000-0000-00000000001b', 'v1.0', '{"vector": [0.045, 0.019, 0.201]}', 'ArcFace-R100', 80.00, 'ACTIVE'),
    ('00000022-0000-0000-0000-000000000022', '0000001c-0000-0000-0000-00000000001c', 'v1.0', '{"vector": [0.077, 0.052, 0.098]}', 'ArcFace-R100', 80.00, 'ACTIVE'),
    ('00000023-0000-0000-0000-000000000023', '0000001e-0000-0000-0000-00000000001e', 'v1.0', '{"vector": [0.033, 0.061, 0.145]}', 'ArcFace-R100', 80.00, 'ACTIVE');

-- ==========================================================
-- TIMETABLE
-- ==========================================================

INSERT INTO timetable
    (timetable_id, batch_id, faculty_id, subject_id, room_id, day_of_week, lecture_number, start_time, end_time, attendance_window_minutes, effective_from)
VALUES
    ('00000034-0000-0000-0000-000000000034', '0000000b-0000-0000-0000-00000000000b', '00000024-0000-0000-0000-000000000024', '0000002e-0000-0000-0000-00000000002e', '0000002b-0000-0000-0000-00000000002b', 'Monday',  1, '09:00', '10:00', 10, '2026-07-01'),
    ('00000035-0000-0000-0000-000000000035', '0000000b-0000-0000-0000-00000000000b', '00000025-0000-0000-0000-000000000025', '0000002f-0000-0000-0000-00000000002f', '0000002c-0000-0000-0000-00000000002c', 'Monday',  2, '10:00', '12:00', 10, '2026-07-01'),
    ('00000036-0000-0000-0000-000000000036', '0000000d-0000-0000-0000-00000000000d', '00000026-0000-0000-0000-000000000026', '00000031-0000-0000-0000-000000000031', '0000002d-0000-0000-0000-00000000002d', 'Tuesday', 1, '09:00', '10:00', 10, '2026-07-01');

-- ==========================================================
-- ATTENDANCE SESSION
-- ==========================================================

INSERT INTO attendance_session
    (attendance_session_id, timetable_id, session_date, start_time, end_time, session_status, attendance_window_start, attendance_window_end, total_students, present_students, absent_students)
VALUES
    ('00000005-0000-0000-0000-000000000005', '00000034-0000-0000-0000-000000000034', '2026-07-13', '09:00', '10:00', 'COMPLETED', '2026-07-13 09:00:00', '2026-07-13 09:10:00', 2, 2, 0),
    ('00000006-0000-0000-0000-000000000006', '00000035-0000-0000-0000-000000000035', '2026-07-13', '10:00', '12:00', 'ACTIVE',    '2026-07-13 10:00:00', '2026-07-13 10:10:00', 2, 0, 0),
    ('00000007-0000-0000-0000-000000000007', '00000036-0000-0000-0000-000000000036', '2026-07-14', '09:00', '10:00', 'SCHEDULED', NULL, NULL, 2, 0, 0);

-- ==========================================================
-- DEVICE
-- ==========================================================

INSERT INTO device
    (device_id, room_id, device_identifier, device_name, device_type, app_version, operating_system, device_token, pairing_code, pairing_code_expires_at, last_heartbeat, last_sync, battery_percentage, storage_available_mb, network_status, device_status)
VALUES
    -- already paired and active
    ('00000017-0000-0000-0000-000000000017', '0000002b-0000-0000-0000-00000000002b', 'FGDEV-CB101-01', 'Lecture Hall 1 Gate', 'ANDROID_TABLET', '2.4.1', 'Android 13', '00000001-0000-0000-0000-000000000001', NULL, NULL, '2026-07-10 08:55:00', '2026-07-10 08:50:00', 82, 15360, 'ONLINE', 'ACTIVE'),
    -- awaiting pairing, code freshly issued
    ('00000018-0000-0000-0000-000000000018', '0000002c-0000-0000-0000-00000000002c', NULL, 'CS Lab 2 Gate', 'ANDROID_TABLET', NULL, NULL, NULL, '482913', '2026-07-10 23:59:59', NULL, NULL, NULL, NULL, 'OFFLINE', 'PENDING_PAIRING'),
    -- already paired and active
    ('00000019-0000-0000-0000-000000000019', '0000002d-0000-0000-0000-00000000002d', 'FGDEV-CB305-01', 'Seminar Hall A Gate', 'ANDROID_TABLET', '2.4.1', 'Android 14', '00000002-0000-0000-0000-000000000002', NULL, NULL, '2026-07-10 08:40:00', '2026-07-10 08:30:00', 65, 20480, 'ONLINE', 'ACTIVE');

-- ==========================================================
-- ATTENDANCE
-- ==========================================================

INSERT INTO attendance
    (attendance_id, attendance_session_id, student_id, device_id, attendance_status, attendance_mode, recognition_confidence, attendance_time, verification_status, synced, synced_at)
VALUES
    ('00000008-0000-0000-0000-000000000008', '00000005-0000-0000-0000-000000000005', '0000001a-0000-0000-0000-00000000001a', '00000017-0000-0000-0000-000000000017', 'PRESENT', 'FACE_RECOGNITION', 96.50, '2026-07-13 09:02:11', 'VERIFIED', TRUE, '2026-07-13 09:05:00'),
    ('00000009-0000-0000-0000-000000000009', '00000005-0000-0000-0000-000000000005', '0000001b-0000-0000-0000-00000000001b', '00000017-0000-0000-0000-000000000017', 'LATE',    'FACE_RECOGNITION', 91.20, '2026-07-13 09:08:47', 'VERIFIED', TRUE, '2026-07-13 09:10:00'),
    ('0000000a-0000-0000-0000-00000000000a', '00000007-0000-0000-0000-000000000007', '0000001e-0000-0000-0000-00000000001e', '00000019-0000-0000-0000-000000000019', 'PRESENT', 'FACE_RECOGNITION', 88.75, '2026-07-14 09:01:03', 'PENDING',  FALSE, NULL);

-- ==========================================================
-- DEVICE SYNC LOG
-- ==========================================================

INSERT INTO device_sync_log
    (sync_log_id, device_id, sync_type, sync_status, sync_start_time, sync_end_time, records_uploaded, records_downloaded, failed_records, app_version)
VALUES
    ('00000032-0000-0000-0000-000000000032', '00000017-0000-0000-0000-000000000017', 'ATTENDANCE_UPLOAD', 'SUCCESS', '2026-07-13 09:05:00', '2026-07-13 09:05:04', 2, 0, 0, '2.4.1'),
    ('00000033-0000-0000-0000-000000000033', '00000019-0000-0000-0000-000000000019', 'HEARTBEAT',          'SUCCESS', '2026-07-10 08:40:00', '2026-07-10 08:40:01', 0, 0, 0, '2.4.1');

-- ==========================================================
-- HOLIDAY
-- ==========================================================

INSERT INTO holiday
    (holiday_id, calendar_id, holiday_name, holiday_type, description, is_recurring, created_by)
VALUES
    ('00000028-0000-0000-0000-000000000028', '00000010-0000-0000-0000-000000000010', 'Independence Day', 'NATIONAL', 'National holiday observed campus-wide', TRUE, '00000003-0000-0000-0000-000000000003');

-- ==========================================================
-- NOTIFICATION
-- ==========================================================

INSERT INTO notification
    (notification_id, admin_id, title, message, notification_type, priority, is_read, created_by)
VALUES
    ('00000029-0000-0000-0000-000000000029', '00000003-0000-0000-0000-000000000003', 'Device awaiting pairing', 'CS Lab 2 Gate device has a pairing code that expires today.', 'DEVICE', 'MEDIUM', FALSE, '00000004-0000-0000-0000-000000000004'),
    ('0000002a-0000-0000-0000-00000000002a', '00000004-0000-0000-0000-000000000004', 'Low-confidence match flagged', 'A low-confidence face match was recorded in Seminar Hall A.', 'CONFLICT', 'HIGH', FALSE, '00000003-0000-0000-0000-000000000003');

-- ==========================================================
-- CONFLICT
-- ==========================================================

INSERT INTO conflict
    (conflict_id, attendance_id, attendance_session_id, student_id, device_id, conflict_type, severity, conflict_status, description, resolution_notes, resolved_by, resolved_at)
VALUES
    ('00000011-0000-0000-0000-000000000011', '0000000a-0000-0000-0000-00000000000a', '00000007-0000-0000-0000-000000000007', '0000001e-0000-0000-0000-00000000001e', '00000019-0000-0000-0000-000000000019', 'LOW_CONFIDENCE', 'MEDIUM', 'UNDER_REVIEW', 'Face match confidence below preferred threshold (88.75%).', NULL, NULL, NULL);

-- ==========================================================
-- CHANGE LOG
-- ==========================================================

INSERT INTO change_log
    (change_log_id, admin_id, entity_name, entity_id, action, old_values, new_values, ip_address, action_timestamp, remarks)
VALUES
    ('00000012-0000-0000-0000-000000000012', '00000003-0000-0000-0000-000000000003', 'device', '00000018-0000-0000-0000-000000000018', 'CREATE', NULL, '{"device_name": "CS Lab 2 Gate", "device_status": "PENDING_PAIRING"}', '10.0.0.15', '2026-07-10 08:00:00', 'Registered new device awaiting pairing'),
    ('00000013-0000-0000-0000-000000000013', '00000004-0000-0000-0000-000000000004', 'admin_user', '00000004-0000-0000-0000-000000000004', 'LOGIN', NULL, NULL, '10.0.0.22', '2026-07-10 08:10:00', NULL);

COMMIT;
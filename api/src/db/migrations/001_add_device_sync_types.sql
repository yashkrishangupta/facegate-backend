-- 001_add_device_sync_types.sql
--
-- Widens device_sync_log.chk_sync_type to cover the sync categories used by
-- the new device-initiated endpoints: student enrollment, conflict
-- upload/resolve, report pulls, and change-log pushes. Without this, any
-- INSERT into device_sync_log logging one of those actions fails the CHECK
-- constraint and the whole request 500s, even though the actual business
-- logic (student/conflict/change-log write) succeeded.
--
-- Run this against any database that was created from schema.sql before
-- this migration existed. Safe to run multiple times.

ALTER TABLE device_sync_log DROP CONSTRAINT IF EXISTS chk_sync_type;

ALTER TABLE device_sync_log
    ADD CONSTRAINT chk_sync_type
        CHECK (
            sync_type IN (
                'FULL',
                'INCREMENTAL',
                'ATTENDANCE_UPLOAD',
                'HEARTBEAT',
                'HOLIDAY_SYNC',
                'TIMETABLE_SYNC',
                'STUDENT_SYNC',
                'FACE_SYNC',
                'STUDENT_ENROLLMENT',
                'CONFLICT_UPLOAD',
                'CONFLICT_RESOLVE',
                'REPORTS_PULL',
                'CHANGE_LOG_UP'
            )
        );

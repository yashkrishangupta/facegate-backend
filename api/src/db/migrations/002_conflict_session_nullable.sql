-- 002_conflict_session_nullable.sql
--
-- A conflict detected with no resolvable class period (e.g. SYNC_FAILURE,
-- DEVICE_ERROR, or an UNKNOWN_FACE hit that doesn't match any scheduled
-- timetable) previously could not be created at all — conflict.attendance_
-- session_id was NOT NULL, so POST /sync/conflicts silently dropped that
-- record. device_id (already a column on this table) is enough on its own
-- to attribute the conflict to a room/device even with no session.
--
-- Safe to run multiple times.

ALTER TABLE conflict ALTER COLUMN attendance_session_id DROP NOT NULL;

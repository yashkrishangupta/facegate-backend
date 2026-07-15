-- 004_timetable_slot_active_index.sql
--
-- The original uq_timetable_slot was a plain table-level UNIQUE constraint
-- on (batch_id, day_of_week, lecture_number), applied to every row
-- regardless of is_active. That meant a soft-deleted period permanently
-- blocked ever reusing its (batch, day, lecture_number) slot again —
-- there was no way to "replace" a period without the replacement
-- colliding with its own now-inactive predecessor.
--
-- Replaces it with a partial unique index scoped to is_active = TRUE.
-- Actual same-batch time-overlap detection now lives in
-- TimetableRepository.findSchedulingClash (proper start_time/end_time
-- interval overlap, not a lecture_number proxy) — this index is kept only
-- as a defense-in-depth backstop, not the primary correctness mechanism.
--
-- NOTE: if there are currently two ACTIVE rows for the same
-- (batch_id, day_of_week, lecture_number), the CREATE UNIQUE INDEX step
-- will fail — that would mean a real duplicate already exists among active
-- rows. Resolve it first if this happens.
--
-- Safe to run multiple times.

ALTER TABLE timetable DROP CONSTRAINT IF EXISTS uq_timetable_slot;
DROP INDEX IF EXISTS uq_timetable_slot_active;

CREATE UNIQUE INDEX uq_timetable_slot_active
    ON timetable (batch_id, day_of_week, lecture_number)
    WHERE is_active = TRUE;

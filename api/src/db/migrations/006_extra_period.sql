-- 006_extra_period.sql
--
-- Creates the `extra_period` table for the "Extra Period for One Week"
-- feature.
--
-- Temporary extra periods are stored here — permanently separate from the
-- `timetable` table — so that no permanent timetable record is ever
-- overwritten or modified.
--
-- A faculty member can schedule an extra class for a specific calendar week
-- identified by week_start_date (Monday) and week_end_date (Sunday, i.e.
-- week_start_date + 6 days).  The service layer normalises any supplied date
-- to the Monday of its ISO week, so callers may pass any date in the target
-- week.
--
-- Access rules (enforced at the API layer, not here):
--   - FACULTY role: create / update / delete only their own rows
--     (where faculty_id matches their JWT facultyId).
--   - ADMIN / SUPER_ADMIN: full access to all rows.
--
-- Safe to run multiple times (IF NOT EXISTS guards throughout).

CREATE TABLE IF NOT EXISTS extra_period (

    extra_period_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    faculty_id                UUID        NOT NULL,
    batch_id                  UUID        NOT NULL,
    subject_id                UUID        NOT NULL,
    room_id                   UUID        NOT NULL,

    -- The 7-day window this extra class is active for.
    -- week_start_date is always a Monday; week_end_date = week_start_date + 6.
    -- The DB constraint enforces the 7-day span; the service enforces Monday
    -- anchoring so the error message is human-readable.
    week_start_date           DATE        NOT NULL,
    week_end_date             DATE        NOT NULL,

    -- Scheduling — same semantics as timetable.
    day_of_week               VARCHAR(10) NOT NULL,
    lecture_number            INTEGER     NOT NULL,
    start_time                TIME        NOT NULL,
    end_time                  TIME        NOT NULL,

    attendance_window_minutes INTEGER     NOT NULL DEFAULT 15,

    -- Soft-delete flag, mirrors timetable.is_active.
    is_active                 BOOLEAN     NOT NULL DEFAULT TRUE,

    created_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ep_faculty
        FOREIGN KEY (faculty_id)  REFERENCES faculty(faculty_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_ep_batch
        FOREIGN KEY (batch_id)    REFERENCES batch(batch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_ep_subject
        FOREIGN KEY (subject_id)  REFERENCES subject(subject_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_ep_room
        FOREIGN KEY (room_id)     REFERENCES room(room_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    -- day_of_week values match timetable.chk_day_of_week exactly.
    CONSTRAINT chk_ep_day_of_week
        CHECK (day_of_week IN (
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        )),

    CONSTRAINT chk_ep_lecture_number
        CHECK (lecture_number > 0),

    CONSTRAINT chk_ep_attendance_window
        CHECK (attendance_window_minutes BETWEEN 1 AND 60),

    CONSTRAINT chk_ep_time
        CHECK (start_time < end_time),

    -- Enforces the 7-day window at the DB level.
    CONSTRAINT chk_ep_week_range
        CHECK (week_end_date = week_start_date + INTERVAL '6 days')

);

-- Prevent the same batch/week/day/lecture_number being booked twice
-- (active rows only — mirrors the uq_timetable_slot_active pattern).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ep_slot_active
    ON extra_period (batch_id, week_start_date, day_of_week, lecture_number)
    WHERE is_active = TRUE;

-- Supporting indexes.
CREATE INDEX IF NOT EXISTS idx_ep_faculty     ON extra_period (faculty_id);
CREATE INDEX IF NOT EXISTS idx_ep_batch       ON extra_period (batch_id);
CREATE INDEX IF NOT EXISTS idx_ep_week_start  ON extra_period (week_start_date);

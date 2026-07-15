-- 003_student_batch_scoped_uniqueness.sql
--
-- Roll numbers and registration numbers are only meant to be unique within
-- a batch for this university, not across the whole institution (e.g.
-- batch A and batch B can both legitimately have roll number "12"). The
-- original schema had these as globally UNIQUE, which rejected a valid
-- enrollment whenever some other batch happened to reuse the same number.
--
-- NOTE: if any existing data already has a real (batch_id, roll_number) or
-- (batch_id, registration_number) collision, this migration's ADD
-- CONSTRAINT step will fail — that would mean two rows in the SAME batch
-- already share a roll/registration number, which was invalid under the
-- old global-uniqueness rule too. Resolve those duplicates first if it
-- fails to run.
--
-- Safe to run multiple times.

ALTER TABLE student DROP CONSTRAINT IF EXISTS student_registration_number_key;
ALTER TABLE student DROP CONSTRAINT IF EXISTS student_roll_number_key;

ALTER TABLE student DROP CONSTRAINT IF EXISTS uq_student_batch_roll;
ALTER TABLE student DROP CONSTRAINT IF EXISTS uq_student_batch_registration;

ALTER TABLE student
    ADD CONSTRAINT uq_student_batch_roll
        UNIQUE (batch_id, roll_number);

ALTER TABLE student
    ADD CONSTRAINT uq_student_batch_registration
        UNIQUE (batch_id, registration_number);

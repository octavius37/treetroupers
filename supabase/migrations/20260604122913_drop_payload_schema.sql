-- Historically `DROP SCHEMA payload CASCADE;` — removing the Payload CMS tables
-- after Payload was dropped from the stack (commit 3f5e266 "remove payload").
--
-- The payload schema was created by Payload's own migrator, never by a tracked
-- migration, so a fresh local database never has it. `IF EXISTS` keeps this
-- replayable from scratch while still applying to any database that does.
DROP SCHEMA IF EXISTS payload CASCADE;

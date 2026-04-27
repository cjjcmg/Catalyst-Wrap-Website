-- =============================================================================
-- Adds the activity_type enum values exposed in the CRM "Log Activity" UI.
-- The Log Activity dropdown lets users pick call / email / text / meeting /
-- note / follow_up, but the DB enum only had system-generated values
-- (tag_change, status_change, quote_sent), so manual logs failed with
-- 22P02 "invalid input value for enum activity_type".
--
-- Idempotent — ADD VALUE IF NOT EXISTS is a no-op when the value exists.
-- =============================================================================

ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'call';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'email';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'text';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'meeting';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'note';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'follow_up';

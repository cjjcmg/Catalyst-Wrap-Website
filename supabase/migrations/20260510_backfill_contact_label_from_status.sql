-- =============================================================================
-- CATALYST MOTORSPORT — backfill contact label from pipeline status
--
-- Pipeline `contact_status` and the type-label `label` are now interconnected
-- via the API layer (see src/app/api/admin/quotes/route.ts). This migration
-- aligns existing rows to the same mapping in a single UPDATE.
--
-- Mapping:
--   new                                      → lead
--   contacted, quoted                        → contact
--   accepted, scheduled, in_progress,
--     completed                              → client
--   past_client                              → past client
--   lost                                     → (unchanged)
--   any row where archived = true            → (unchanged)
--
-- Overwrites any pre-existing label that conflicts with the new rule. Run
-- once. Safe to re-run (idempotent — re-running on aligned data is a no-op).
-- =============================================================================

UPDATE quotes
SET label = CASE contact_status::text
              WHEN 'new'         THEN 'lead'
              WHEN 'contacted'   THEN 'contact'
              WHEN 'quoted'      THEN 'contact'
              WHEN 'accepted'    THEN 'client'
              WHEN 'scheduled'   THEN 'client'
              WHEN 'in_progress' THEN 'client'
              WHEN 'completed'   THEN 'client'
              WHEN 'past_client' THEN 'past client'
            END
WHERE archived IS NOT TRUE
  AND contact_status IS NOT NULL
  AND contact_status::text <> 'lost'
  AND label IS DISTINCT FROM CASE contact_status::text
              WHEN 'new'         THEN 'lead'
              WHEN 'contacted'   THEN 'contact'
              WHEN 'quoted'      THEN 'contact'
              WHEN 'accepted'    THEN 'client'
              WHEN 'scheduled'   THEN 'client'
              WHEN 'in_progress' THEN 'client'
              WHEN 'completed'   THEN 'client'
              WHEN 'past_client' THEN 'past client'
            END;

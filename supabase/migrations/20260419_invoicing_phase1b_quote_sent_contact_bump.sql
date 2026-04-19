-- =============================================================================
-- CATALYST MOTORSPORT — INVOICING SYSTEM
-- Phase 1b patch: on quote 'sent' transition, advance the contact's
-- pipeline status to 'quoted' (forward-only) and promote their tag to 'A'
-- if it isn't already.
--
-- CREATE OR REPLACE the whole sales_quotes_crm_hooks() function; everything
-- else in the function body is preserved from the original Phase 1b install.
-- Idempotent — safe to re-run.
-- =============================================================================

CREATE OR REPLACE FUNCTION sales_quotes_crm_hooks() RETURNS trigger AS $fn_sq_hooks$
DECLARE
  v_customer_name text;
  v_link text;
  v_amount_fmt text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_customer_name FROM quotes WHERE id = NEW.contact_id;
  v_link := '/admin/quotes-docs/' || NEW.id;
  v_amount_fmt := to_char(NEW.total, 'FM999,999.00');

  IF NEW.status = 'sent' THEN
    INSERT INTO crm_activities (quote_id, agent_id, activity_type, subject, metadata)
    VALUES (
      NEW.contact_id, NEW.assigned_agent_id, 'quote_sent',
      format('Quote %s sent for $%s', NEW.quote_number, v_amount_fmt),
      jsonb_build_object(
        'sales_quote_id', NEW.id,
        'quote_number', NEW.quote_number,
        'total', NEW.total
      )
    );

    -- Bump contact forward to 'quoted' only if they're earlier in the pipeline.
    -- Upgrade their tag to 'A' if it isn't already.
    UPDATE quotes SET
      last_contact_date = now(),
      contact_status = CASE
        WHEN contact_status IN ('new', 'contacted') THEN 'quoted'::contact_status
        WHEN contact_status IS NULL THEN 'quoted'::contact_status
        ELSE contact_status
      END,
      contact_tag = CASE
        WHEN contact_tag IS DISTINCT FROM 'A' THEN 'A'::contact_tag
        ELSE contact_tag
      END
    WHERE id = NEW.contact_id;

  ELSIF NEW.status = 'viewed' THEN
    INSERT INTO crm_activities (quote_id, agent_id, activity_type, subject, metadata)
    VALUES (
      NEW.contact_id, NEW.assigned_agent_id, 'status_change',
      format('Customer viewed quote %s', NEW.quote_number),
      jsonb_build_object(
        'sales_quote_id', NEW.id,
        'quote_number', NEW.quote_number,
        'event', 'viewed'
      )
    );

  ELSIF NEW.status = 'accepted' THEN
    INSERT INTO crm_activities (quote_id, agent_id, activity_type, subject, body, metadata)
    VALUES (
      NEW.contact_id, NEW.assigned_agent_id, 'status_change',
      format('Quote %s accepted — signed by %s',
             NEW.quote_number, COALESCE(NEW.accepted_by_name, '(unknown)')),
      format('Accepted at %s from IP %s',
             to_char(COALESCE(NEW.accepted_at, now()), 'YYYY-MM-DD HH24:MI'),
             COALESCE(NEW.accepted_ip::text, 'n/a')),
      jsonb_build_object(
        'sales_quote_id', NEW.id,
        'quote_number', NEW.quote_number,
        'event', 'accepted',
        'total', NEW.total,
        'accepted_by_name', NEW.accepted_by_name,
        'accepted_ip', NEW.accepted_ip::text,
        'accepted_user_agent', NEW.accepted_user_agent
      )
    );

    PERFORM crm_notify_team(
      NEW.assigned_agent_id,
      'status_change'::notification_type,
      format('✅ %s accepted %s — $%s', v_customer_name, NEW.quote_number, v_amount_fmt),
      format('Signed by %s', COALESCE(NEW.accepted_by_name, '(unknown)')),
      v_link,
      NEW.contact_id
    );

    UPDATE quotes SET
      contact_status = CASE
        WHEN contact_status IN ('client', 'past_client') THEN contact_status
        ELSE 'client'::contact_status
      END,
      estimated_value = NEW.total,
      last_contact_date = now()
    WHERE id = NEW.contact_id;

    IF NEW.assigned_agent_id IS NOT NULL THEN
      INSERT INTO crm_reminders (
        quote_id, agent_id, reminder_date, reminder_type, message, is_auto_generated
      )
      VALUES (
        NEW.contact_id, NEW.assigned_agent_id,
        now() + interval '48 hours', 'follow_up',
        format('Send Square invoice for %s', NEW.quote_number),
        true
      );
    END IF;

  ELSIF NEW.status = 'declined' THEN
    INSERT INTO crm_activities (quote_id, agent_id, activity_type, subject, metadata)
    VALUES (
      NEW.contact_id, NEW.assigned_agent_id, 'status_change',
      format('Quote %s declined by customer', NEW.quote_number),
      jsonb_build_object(
        'sales_quote_id', NEW.id,
        'quote_number', NEW.quote_number,
        'event', 'declined'
      )
    );
    UPDATE quotes SET
      contact_status = CASE
        WHEN contact_status IN ('client', 'past_client', 'completed', 'in_progress', 'scheduled')
          THEN contact_status
        ELSE 'lost'::contact_status
      END,
      last_contact_date = now()
    WHERE id = NEW.contact_id;

  ELSIF NEW.status = 'expired' THEN
    INSERT INTO crm_activities (quote_id, agent_id, activity_type, subject, metadata)
    VALUES (
      NEW.contact_id, NEW.assigned_agent_id, 'status_change',
      format('Quote %s expired', NEW.quote_number),
      jsonb_build_object(
        'sales_quote_id', NEW.id,
        'quote_number', NEW.quote_number,
        'event', 'expired'
      )
    );

  ELSIF NEW.status = 'converted' THEN
    NULL;
  END IF;

  RETURN NEW;
END;
$fn_sq_hooks$ LANGUAGE plpgsql;

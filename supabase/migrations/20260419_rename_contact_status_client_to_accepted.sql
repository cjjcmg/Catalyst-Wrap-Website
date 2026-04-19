-- =============================================================================
-- CATALYST MOTORSPORT — rename contact_status 'client' → 'accepted'
--
-- The CRM pipeline previously put 'client' after 'completed' — treating it as
-- a terminal 'won' state. We're repositioning it earlier in the flow:
--   new → contacted → quoted → accepted → scheduled → in_progress →
--     completed → past_client → lost
-- so staff can see accepted quotes as a distinct stage before an appointment
-- is scheduled. Pure rename (enum oid stays), then update the Phase 1b
-- triggers that reference the old label in their forward-only guards.
-- Idempotent — safe to re-run.
-- =============================================================================

-- 1. Rename the enum value. Postgres 10+ supports this directly; oid is
--    preserved so existing rows with the old label auto-reflect the new one.
DO $rename$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client'
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contact_status'))
     AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accepted'
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contact_status'))
  THEN
    ALTER TYPE contact_status RENAME VALUE 'client' TO 'accepted';
  END IF;
END $rename$;

-- 2. Re-install the sales_quotes_crm_hooks trigger with updated forward-only
--    guards. Any CASE branch that used to test `IN ('client', ...)` now
--    tests against ('accepted', ...) plus the later pipeline stages so
--    accept/decline/invoice-paid events never demote a further-along contact.
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

    -- Move forward to 'accepted' unless already further along or terminal.
    UPDATE quotes SET
      contact_status = CASE
        WHEN contact_status IN ('accepted', 'scheduled', 'in_progress', 'completed', 'past_client') THEN contact_status
        ELSE 'accepted'::contact_status
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
        WHEN contact_status IN ('accepted', 'scheduled', 'in_progress', 'completed', 'past_client') THEN contact_status
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

-- 3. Re-install the invoices_crm_hooks trigger with the same label update.
CREATE OR REPLACE FUNCTION invoices_crm_hooks() RETURNS trigger AS $fn_inv_hooks$
DECLARE
  v_customer_name text;
  v_quote_number text;
  v_agent_id int;
  v_amount_fmt text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  SELECT q.name, sq.quote_number, sq.assigned_agent_id
    INTO v_customer_name, v_quote_number, v_agent_id
  FROM sales_quotes sq
  JOIN quotes q ON q.id = sq.contact_id
  WHERE sq.id = NEW.sales_quote_id;

  v_amount_fmt := to_char(NEW.amount, 'FM999,999.00');

  INSERT INTO crm_activities (quote_id, agent_id, activity_type, subject, metadata)
  VALUES (
    NEW.contact_id, v_agent_id, 'status_change',
    format('Payment received: $%s — %s (%s)',
           v_amount_fmt, NEW.invoice_number, NEW.type),
    jsonb_build_object(
      'invoice_id', NEW.id,
      'invoice_number', NEW.invoice_number,
      'sales_quote_id', NEW.sales_quote_id,
      'type', NEW.type,
      'amount', NEW.amount,
      'event', 'invoice_paid'
    )
  );

  PERFORM crm_notify_team(
    v_agent_id,
    'status_change'::notification_type,
    format('💵 %s paid %s — $%s', v_customer_name, NEW.invoice_number, v_amount_fmt),
    format('Invoice type: %s', NEW.type),
    '/admin/invoices/' || NEW.id,
    NEW.contact_id
  );

  -- Ensure at least 'accepted' status; don't demote scheduled/in_progress/etc.
  UPDATE quotes SET
    contact_status = CASE
      WHEN contact_status IN ('accepted', 'scheduled', 'in_progress', 'completed', 'past_client') THEN contact_status
      ELSE 'accepted'::contact_status
    END,
    last_contact_date = now()
  WHERE id = NEW.contact_id;

  IF v_agent_id IS NOT NULL THEN
    INSERT INTO crm_reminders (
      quote_id, agent_id, reminder_date, reminder_type, message, is_auto_generated
    )
    VALUES (
      NEW.contact_id, v_agent_id,
      now() + interval '30 days', 'follow_up',
      format('30-day warranty follow-up for %s', v_customer_name),
      true
    );
  END IF;

  IF NEW.type = 'deposit' AND v_agent_id IS NOT NULL THEN
    INSERT INTO crm_reminders (
      quote_id, agent_id, reminder_date, reminder_type, message, is_auto_generated
    )
    VALUES (
      NEW.contact_id, v_agent_id,
      now() + interval '60 days', 'follow_up',
      format('Send balance invoice for %s when job is complete', v_quote_number),
      true
    );
  END IF;

  RETURN NEW;
END;
$fn_inv_hooks$ LANGUAGE plpgsql;

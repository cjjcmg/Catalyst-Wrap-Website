-- =============================================================================
-- CATALYST MOTORSPORT — INVOICING SYSTEM
-- Phase 1 Migration: Schema + Catalog + Numbering + Settings
-- Fully idempotent — safe to re-run.
-- NOTE: uses tagged dollar-quotes ($tag$ ... $tag$) to survive SQL editors
-- that split naively on bare `$$`.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUM TYPES
DO $enum_sqs$ BEGIN
  CREATE TYPE sales_quote_status AS ENUM (
    'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum_sqs$;

DO $enum_pc$ BEGIN
  CREATE TYPE product_category AS ENUM ('wrap', 'ppf', 'ceramic', 'detail');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum_pc$;

DO $enum_st$ BEGIN
  CREATE TYPE size_tier AS ENUM ('small', 'mid', 'suv', 'truck', 'exotic');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum_st$;

DO $enum_it$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('deposit', 'balance', 'full');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum_it$;

DO $enum_is$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft', 'sent_to_square', 'pending_payment', 'paid', 'void'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum_is$;

DO $enum_dt$ BEGIN
  CREATE TYPE deposit_type AS ENUM ('fixed_amount', 'percent', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum_dt$;

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id            bigserial PRIMARY KEY,
  category      product_category NOT NULL,
  name          text NOT NULL,
  description   text,
  is_taxable    boolean NOT NULL DEFAULT true,
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_active_idx ON products(category, is_active);
CREATE INDEX IF NOT EXISTS products_sort_idx ON products(category, sort_order);

-- 3. PRODUCT_PRICING
CREATE TABLE IF NOT EXISTS product_pricing (
  id             bigserial PRIMARY KEY,
  product_id     bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_tier      size_tier NOT NULL,
  default_price  numeric(10,2) NOT NULL,
  UNIQUE (product_id, size_tier)
);
CREATE INDEX IF NOT EXISTS product_pricing_product_idx ON product_pricing(product_id);

-- 4. EXTEND quotes (contacts) — Square customer cache
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS square_customer_id text;

-- 5. SALES_QUOTES
CREATE TABLE IF NOT EXISTS sales_quotes (
  id                            bigserial PRIMARY KEY,
  quote_number                  text UNIQUE NOT NULL,
  contact_id                    bigint NOT NULL REFERENCES quotes(id),
  status                        sales_quote_status NOT NULL DEFAULT 'draft',
  vehicle_year                  text,
  vehicle_make                  text,
  vehicle_model                 text,
  vehicle_color                 text,
  vehicle_size_tier             size_tier NOT NULL,
  subtotal                      numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount               numeric(10,2) NOT NULL DEFAULT 0,
  discount_reason               text,
  tax_rate                      numeric(5,4) NOT NULL DEFAULT 0.0775,
  tax_amount                    numeric(10,2) NOT NULL DEFAULT 0,
  total                         numeric(10,2) NOT NULL DEFAULT 0,
  deposit_type                  deposit_type NOT NULL DEFAULT 'none',
  deposit_value                 numeric(10,2),
  deposit_amount_calc           numeric(10,2),
  internal_notes                text,
  customer_notes                text,
  terms                         text,
  expires_at                    timestamptz,
  public_token                  uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  sent_at                       timestamptz,
  viewed_at                     timestamptz,
  accepted_at                   timestamptz,
  declined_at                   timestamptz,
  accepted_by_name              text,
  accepted_signature_checkbox   boolean,
  accepted_ip                   inet,
  accepted_user_agent           text,
  assigned_agent_id             int REFERENCES users(id),
  created_by_user_id            int NOT NULL REFERENCES users(id),
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_quotes_contact_idx ON sales_quotes(contact_id);
CREATE INDEX IF NOT EXISTS sales_quotes_status_idx ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS sales_quotes_agent_idx ON sales_quotes(assigned_agent_id);
CREATE INDEX IF NOT EXISTS sales_quotes_created_idx ON sales_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS sales_quotes_expires_idx ON sales_quotes(expires_at) WHERE status IN ('sent', 'viewed');

-- 6. SALES_QUOTE_LINE_ITEMS
CREATE TABLE IF NOT EXISTS sales_quote_line_items (
  id                bigserial PRIMARY KEY,
  sales_quote_id    bigint NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
  product_id        bigint REFERENCES products(id),
  description       text NOT NULL,
  quantity          numeric(10,2) NOT NULL DEFAULT 1,
  unit_price        numeric(10,2) NOT NULL,
  line_total        numeric(10,2) NOT NULL,
  is_taxable        boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sql_items_quote_idx ON sales_quote_line_items(sales_quote_id);

-- 7. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id                    bigserial PRIMARY KEY,
  invoice_number        text UNIQUE NOT NULL,
  sales_quote_id        bigint NOT NULL REFERENCES sales_quotes(id),
  contact_id            bigint NOT NULL REFERENCES quotes(id),
  type                  invoice_type NOT NULL,
  amount                numeric(10,2) NOT NULL,
  status                invoice_status NOT NULL DEFAULT 'draft',
  square_invoice_id     text,
  square_public_url     text,
  sent_to_square_at     timestamptz,
  paid_at               timestamptz,
  created_by_user_id    int NOT NULL REFERENCES users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_quote_idx ON invoices(sales_quote_id);
CREATE INDEX IF NOT EXISTS invoices_contact_idx ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_paid_idx ON invoices(paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoices_square_invoice_idx ON invoices(square_invoice_id) WHERE square_invoice_id IS NOT NULL;

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id                   bigserial PRIMARY KEY,
  invoice_id           bigint NOT NULL REFERENCES invoices(id),
  amount               numeric(10,2) NOT NULL,
  square_payment_id    text UNIQUE,
  payment_method       text,
  paid_at              timestamptz NOT NULL,
  raw_webhook_payload  jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_paid_idx ON payments(paid_at DESC);

-- 9. INVOICING_SETTINGS
CREATE TABLE IF NOT EXISTS invoicing_settings (
  id                          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_tax_rate            numeric(5,4) NOT NULL DEFAULT 0.0775,
  default_expiration_days     int NOT NULL DEFAULT 30,
  default_terms               text,
  logo_url                    text,
  square_location_id          text,
  notification_email          text NOT NULL DEFAULT 'team@catalystmotorsport.com',
  business_name               text NOT NULL DEFAULT 'Catalyst Motorsport',
  business_address            text NOT NULL DEFAULT '1161 N Cosby Way, Unit T, Anaheim, CA 92806',
  business_phone              text NOT NULL DEFAULT '714.442.1333',
  business_website            text NOT NULL DEFAULT 'www.CatalystMotorsport.com',
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO invoicing_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 10. NUMBERING — table-backed yearly counters (no dynamic EXECUTE)
CREATE TABLE IF NOT EXISTS numbering_counters (
  prefix      text NOT NULL,
  year        int  NOT NULL,
  last_value  bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, year)
);

CREATE OR REPLACE FUNCTION next_quote_number() RETURNS text AS $fn_nq$
  WITH upserted AS (
    INSERT INTO numbering_counters (prefix, year, last_value)
    VALUES ('Q', extract(year FROM now())::int, 1)
    ON CONFLICT (prefix, year)
      DO UPDATE SET last_value = numbering_counters.last_value + 1
    RETURNING last_value, year
  )
  SELECT 'Q-' || year::text || '-' || lpad(last_value::text, 4, '0') FROM upserted;
$fn_nq$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION next_invoice_number() RETURNS text AS $fn_ni$
  WITH upserted AS (
    INSERT INTO numbering_counters (prefix, year, last_value)
    VALUES ('INV', extract(year FROM now())::int, 1)
    ON CONFLICT (prefix, year)
      DO UPDATE SET last_value = numbering_counters.last_value + 1
    RETURNING last_value, year
  )
  SELECT 'INV-' || year::text || '-' || lpad(last_value::text, 4, '0') FROM upserted;
$fn_ni$ LANGUAGE sql;

-- 11. TRIGGER — updated_at maintenance
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $fn_touch$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$fn_touch$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_touch_updated_at ON products;
CREATE TRIGGER products_touch_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS sales_quotes_touch_updated_at ON sales_quotes;
CREATE TRIGGER sales_quotes_touch_updated_at BEFORE UPDATE ON sales_quotes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS invoices_touch_updated_at ON invoices;
CREATE TRIGGER invoices_touch_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS invoicing_settings_touch_updated_at ON invoicing_settings;
CREATE TRIGGER invoicing_settings_touch_updated_at BEFORE UPDATE ON invoicing_settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 12. TRIGGER — auto-recompute totals when line items change
CREATE OR REPLACE FUNCTION recompute_sales_quote_totals() RETURNS trigger AS $fn_recomp$
DECLARE
  v_quote_id bigint; v_subtotal numeric(10,2); v_taxable_sub numeric(10,2);
  v_discount numeric(10,2); v_tax_rate numeric(5,4); v_tax numeric(10,2);
  v_total numeric(10,2); v_deposit_type deposit_type;
  v_deposit_value numeric(10,2); v_deposit_calc numeric(10,2);
BEGIN
  v_quote_id := COALESCE(NEW.sales_quote_id, OLD.sales_quote_id);
  SELECT COALESCE(SUM(line_total), 0),
         COALESCE(SUM(line_total) FILTER (WHERE is_taxable), 0)
    INTO v_subtotal, v_taxable_sub
  FROM sales_quote_line_items WHERE sales_quote_id = v_quote_id;

  SELECT discount_amount, tax_rate, deposit_type, deposit_value
    INTO v_discount, v_tax_rate, v_deposit_type, v_deposit_value
  FROM sales_quotes WHERE id = v_quote_id;

  IF v_subtotal > 0 THEN
    v_taxable_sub := GREATEST(0, v_taxable_sub - (v_discount * v_taxable_sub / v_subtotal));
  END IF;

  v_tax := ROUND(v_taxable_sub * v_tax_rate, 2);
  v_total := v_subtotal - v_discount + v_tax;
  v_deposit_calc := CASE
    WHEN v_deposit_type = 'fixed_amount' THEN v_deposit_value
    WHEN v_deposit_type = 'percent' THEN ROUND(v_total * (v_deposit_value / 100.0), 2)
    ELSE NULL
  END;

  UPDATE sales_quotes
    SET subtotal = v_subtotal, tax_amount = v_tax, total = v_total,
        deposit_amount_calc = v_deposit_calc
  WHERE id = v_quote_id;
  RETURN NULL;
END;
$fn_recomp$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sql_items_recompute_on_ins ON sales_quote_line_items;
CREATE TRIGGER sql_items_recompute_on_ins AFTER INSERT ON sales_quote_line_items
  FOR EACH ROW EXECUTE FUNCTION recompute_sales_quote_totals();
DROP TRIGGER IF EXISTS sql_items_recompute_on_upd ON sales_quote_line_items;
CREATE TRIGGER sql_items_recompute_on_upd AFTER UPDATE ON sales_quote_line_items
  FOR EACH ROW EXECUTE FUNCTION recompute_sales_quote_totals();
DROP TRIGGER IF EXISTS sql_items_recompute_on_del ON sales_quote_line_items;
CREATE TRIGGER sql_items_recompute_on_del AFTER DELETE ON sales_quote_line_items
  FOR EACH ROW EXECUTE FUNCTION recompute_sales_quote_totals();

CREATE OR REPLACE FUNCTION recompute_sales_quote_on_self_change() RETURNS trigger AS $fn_recomp_self$
DECLARE
  v_subtotal numeric(10,2); v_taxable_sub numeric(10,2);
  v_tax numeric(10,2); v_total numeric(10,2); v_deposit_calc numeric(10,2);
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.discount_amount IS NOT DISTINCT FROM OLD.discount_amount AND
    NEW.tax_rate IS NOT DISTINCT FROM OLD.tax_rate AND
    NEW.deposit_type IS NOT DISTINCT FROM OLD.deposit_type AND
    NEW.deposit_value IS NOT DISTINCT FROM OLD.deposit_value
  ) THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(line_total), 0),
         COALESCE(SUM(line_total) FILTER (WHERE is_taxable), 0)
    INTO v_subtotal, v_taxable_sub
  FROM sales_quote_line_items WHERE sales_quote_id = NEW.id;

  IF v_subtotal > 0 THEN
    v_taxable_sub := GREATEST(0, v_taxable_sub - (NEW.discount_amount * v_taxable_sub / v_subtotal));
  END IF;

  v_tax := ROUND(v_taxable_sub * NEW.tax_rate, 2);
  v_total := v_subtotal - NEW.discount_amount + v_tax;
  v_deposit_calc := CASE
    WHEN NEW.deposit_type = 'fixed_amount' THEN NEW.deposit_value
    WHEN NEW.deposit_type = 'percent' THEN ROUND(v_total * (NEW.deposit_value / 100.0), 2)
    ELSE NULL
  END;

  NEW.subtotal := v_subtotal; NEW.tax_amount := v_tax;
  NEW.total := v_total; NEW.deposit_amount_calc := v_deposit_calc;
  RETURN NEW;
END;
$fn_recomp_self$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_quotes_recompute_on_self ON sales_quotes;
CREATE TRIGGER sales_quotes_recompute_on_self BEFORE UPDATE ON sales_quotes
  FOR EACH ROW EXECUTE FUNCTION recompute_sales_quote_on_self_change();

-- 13. TRIGGER — auto-assign numbers on insert
CREATE OR REPLACE FUNCTION assign_quote_number() RETURNS trigger AS $fn_aqn$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := next_quote_number();
  END IF; RETURN NEW;
END;
$fn_aqn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sales_quotes_assign_number ON sales_quotes;
CREATE TRIGGER sales_quotes_assign_number BEFORE INSERT ON sales_quotes
  FOR EACH ROW EXECUTE FUNCTION assign_quote_number();

CREATE OR REPLACE FUNCTION assign_invoice_number() RETURNS trigger AS $fn_ain$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := next_invoice_number();
  END IF; RETURN NEW;
END;
$fn_ain$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS invoices_assign_number ON invoices;
CREATE TRIGGER invoices_assign_number BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION assign_invoice_number();

-- 14. TRIGGER — auto-set expires_at and sent_at when status becomes 'sent'
CREATE OR REPLACE FUNCTION set_quote_expiration_on_send() RETURNS trigger AS $fn_setexp$
DECLARE v_days int;
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.status = 'sent' AND NEW.expires_at IS NULL THEN
    SELECT default_expiration_days INTO v_days FROM invoicing_settings WHERE id = 1;
    NEW.expires_at := now() + (v_days || ' days')::interval;
    NEW.sent_at := COALESCE(NEW.sent_at, now());
  END IF;
  RETURN NEW;
END;
$fn_setexp$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sales_quotes_expiration_on_send ON sales_quotes;
CREATE TRIGGER sales_quotes_expiration_on_send BEFORE UPDATE ON sales_quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_expiration_on_send();

-- 15. SEED CATALOG (only if empty)
DO $seed_catalog$
DECLARE v_product_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM products LIMIT 1) THEN RETURN; END IF;

  -- VINYL WRAPS
  INSERT INTO products (category, name, description, sort_order)
    VALUES ('wrap', 'Full Vehicle Wrap — Gloss', 'Full body gloss vinyl wrap, premium cast film', 10)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 3500), (v_product_id, 'mid', 4500),
    (v_product_id, 'suv', 5500), (v_product_id, 'truck', 6000), (v_product_id, 'exotic', 7500);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('wrap', 'Full Vehicle Wrap — Matte/Satin', 'Full body matte or satin finish', 20)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 3800), (v_product_id, 'mid', 4800),
    (v_product_id, 'suv', 5800), (v_product_id, 'truck', 6300), (v_product_id, 'exotic', 7800);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('wrap', 'Partial Wrap — Front End', 'Hood, bumper, fenders, mirrors', 30)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 1200), (v_product_id, 'mid', 1500),
    (v_product_id, 'suv', 1800), (v_product_id, 'truck', 2000), (v_product_id, 'exotic', 2500);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('wrap', 'Roof Wrap', 'Gloss black or custom color roof', 40)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 400), (v_product_id, 'mid', 500),
    (v_product_id, 'suv', 650), (v_product_id, 'truck', 700), (v_product_id, 'exotic', 800);

  -- PPF
  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ppf', 'Full Body PPF', 'Complete paint protection film coverage', 10)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 5500), (v_product_id, 'mid', 6500),
    (v_product_id, 'suv', 7500), (v_product_id, 'truck', 8500), (v_product_id, 'exotic', 10000);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ppf', 'Full Front PPF', 'Full hood, fenders, bumper, mirrors', 20)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 2200), (v_product_id, 'mid', 2600),
    (v_product_id, 'suv', 3000), (v_product_id, 'truck', 3300), (v_product_id, 'exotic', 3800);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ppf', 'Partial Front PPF', 'Partial hood, fenders, bumper, mirrors', 30)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 1200), (v_product_id, 'mid', 1400),
    (v_product_id, 'suv', 1600), (v_product_id, 'truck', 1800), (v_product_id, 'exotic', 2200);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ppf', 'Headlight PPF', 'Protection film on headlights', 40)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 150), (v_product_id, 'mid', 150),
    (v_product_id, 'suv', 175), (v_product_id, 'truck', 175), (v_product_id, 'exotic', 250);

  -- CERAMIC
  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ceramic', 'Ceramic Coating — 1 Year', 'Entry-level ceramic protection', 10)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 600), (v_product_id, 'mid', 700),
    (v_product_id, 'suv', 800), (v_product_id, 'truck', 900), (v_product_id, 'exotic', 1100);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ceramic', 'Ceramic Coating — 5 Year', '5yr warranty ceramic', 20)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 1200), (v_product_id, 'mid', 1400),
    (v_product_id, 'suv', 1600), (v_product_id, 'truck', 1800), (v_product_id, 'exotic', 2200);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('ceramic', 'Ceramic Coating — Lifetime', 'Lifetime warranty ceramic', 30)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 1800), (v_product_id, 'mid', 2100),
    (v_product_id, 'suv', 2400), (v_product_id, 'truck', 2700), (v_product_id, 'exotic', 3200);

  -- DETAIL
  INSERT INTO products (category, name, description, sort_order)
    VALUES ('detail', 'Paint Correction — Single Stage', '1-step polish', 10)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 500), (v_product_id, 'mid', 600),
    (v_product_id, 'suv', 700), (v_product_id, 'truck', 800), (v_product_id, 'exotic', 1000);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('detail', 'Paint Correction — Multi Stage', '2–3 step correction', 20)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 900), (v_product_id, 'mid', 1100),
    (v_product_id, 'suv', 1300), (v_product_id, 'truck', 1500), (v_product_id, 'exotic', 1800);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('detail', 'Full Detail — Interior & Exterior', 'Complete wash, decon, interior', 30)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 250), (v_product_id, 'mid', 300),
    (v_product_id, 'suv', 350), (v_product_id, 'truck', 400), (v_product_id, 'exotic', 500);

  INSERT INTO products (category, name, description, sort_order)
    VALUES ('detail', 'Wrap/PPF Removal', 'Film removal labor', 40)
    RETURNING id INTO v_product_id;
  INSERT INTO product_pricing (product_id, size_tier, default_price) VALUES
    (v_product_id, 'small', 400), (v_product_id, 'mid', 500),
    (v_product_id, 'suv', 600), (v_product_id, 'truck', 700), (v_product_id, 'exotic', 900);
END $seed_catalog$;

-- 16. DASHBOARD VIEWS
CREATE OR REPLACE VIEW invoicing_revenue_rollup AS
SELECT p.paid_at::date AS paid_date,
  date_trunc('month', p.paid_at)::date AS paid_month,
  date_trunc('quarter', p.paid_at)::date AS paid_quarter,
  date_trunc('year', p.paid_at)::date AS paid_year,
  p.amount, i.type AS invoice_type, i.contact_id,
  sq.assigned_agent_id, sq.vehicle_size_tier,
  p.id AS payment_id, i.id AS invoice_id, sq.id AS sales_quote_id
FROM payments p
JOIN invoices i ON i.id = p.invoice_id
JOIN sales_quotes sq ON sq.id = i.sales_quote_id;

CREATE OR REPLACE VIEW invoicing_quote_funnel AS
SELECT
  count(*) FILTER (WHERE sent_at IS NOT NULL) AS sent_count,
  count(*) FILTER (WHERE viewed_at IS NOT NULL) AS viewed_count,
  count(*) FILTER (WHERE accepted_at IS NOT NULL) AS accepted_count,
  count(*) FILTER (WHERE status = 'converted') AS converted_count,
  count(*) FILTER (WHERE status = 'declined') AS declined_count,
  count(*) FILTER (WHERE status = 'expired') AS expired_count
FROM sales_quotes;

CREATE OR REPLACE VIEW invoicing_outstanding AS
SELECT i.id, i.invoice_number, i.contact_id, i.amount,
  i.sent_to_square_at, i.type,
  q.name AS customer_name, q.email AS customer_email,
  sq.quote_number, sq.assigned_agent_id
FROM invoices i
JOIN quotes q ON q.id = i.contact_id
JOIN sales_quotes sq ON sq.id = i.sales_quote_id
WHERE i.status = 'pending_payment';

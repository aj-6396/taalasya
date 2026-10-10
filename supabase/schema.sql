-- ==============================================================================
-- TAALASYA - JHOOM '26 TICKETING SYSTEM
-- Supabase PostgreSQL Database Schema
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create the `tickets` table
CREATE TABLE IF NOT EXISTS public.tickets (
  "ticketId" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "college" TEXT,
  "paymentId" TEXT,
  "orderId" TEXT,
  "amount" NUMERIC DEFAULT 299,
  "status" TEXT NOT NULL DEFAULT 'Valid',
  "eventName" TEXT DEFAULT 'JHOOM ''26 — Dance Fest cum Dandiya Night',
  "idCardUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  "usedAt" TIMESTAMPTZ
);

-- Ensure idCardUrl and college columns exist if table was already created
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "idCardUrl" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "college" TEXT;

-- 2. Helpful Comment on Table
COMMENT ON TABLE public.tickets IS 'Stores participant tickets for JHOOM 26 Dance Fest cum Dandiya Night (Taalasya Dance Society, BHU)';

-- 3. Performance Indexes for Fast Verification & Lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets ("ticketId");
CREATE INDEX IF NOT EXISTS idx_tickets_payment_id ON public.tickets ("paymentId");
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON public.tickets ("orderId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets ("status");

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 5. Policies:
-- Drop existing policies if re-running script
DROP POLICY IF EXISTS "Allow service role full access" ON public.tickets;
DROP POLICY IF EXISTS "Allow public read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public update ticket status" ON public.tickets;

-- (a) Full access for backend service role
CREATE POLICY "Allow service role full access"
ON public.tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- (b) Allow reading tickets (for /success and /scan lookup)
CREATE POLICY "Allow public read tickets"
ON public.tickets
FOR SELECT
TO anon, authenticated
USING (true);

-- (c) Allow inserting new tickets upon successful payment verification
CREATE POLICY "Allow public insert tickets"
ON public.tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- (d) Allow updating ticket status (marking Valid -> Used when scanned at gate)
CREATE POLICY "Allow public update ticket status"
ON public.tickets
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Storage Bucket for Namaste BHU ID Card Uploads (Optional but Recommended)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('id-cards', 'id-cards', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read id-cards" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'id-cards');

CREATE POLICY "Allow service role upload id-cards" ON storage.objects
FOR ALL TO service_role USING (bucket_id = 'id-cards') WITH CHECK (bucket_id = 'id-cards');

-- Ensure columns for marshal tracking exist in tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "scannedBy" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "marshalPin" TEXT;

-- 7. Gate Marshals Table (Track all 4 gate volunteers + supervisors)
CREATE TABLE IF NOT EXISTS public.gate_marshals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  gate TEXT DEFAULT 'Gate A',
  "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Pre-populate 4 Gate Marshals (2 on Gate A, 2 on Gate B) + 1 Lead Supervisor
INSERT INTO public.gate_marshals (id, name, pin, gate)
VALUES 
  ('marshal_1', 'Marshal 1', '4821', 'Gate A (Lane 1)'),
  ('marshal_2', 'Marshal 2', '7395', 'Gate A (Lane 2)'),
  ('marshal_3', 'Marshal 3', '2964', 'Gate B (Lane 1)'),
  ('marshal_4', 'Marshal 4', '8153', 'Gate B (Lane 2)'),
  ('admin', 'Lead Supervisor', '6028', 'All Gates (Supervisor)')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pin = EXCLUDED.pin, gate = EXCLUDED.gate;

-- 8. Scan Logs Audit Table (Audit trail of every scan; powers live table & persistent counters)
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id BIGSERIAL PRIMARY KEY,
  "ticketId" TEXT NOT NULL,
  "marshalName" TEXT NOT NULL,
  "marshalPin" TEXT,
  "scanStatus" TEXT NOT NULL, -- 'Valid', 'Already Used', 'Invalid'
  "attendeeName" TEXT,
  "scannedAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket ON public.scan_logs ("ticketId");
CREATE INDEX IF NOT EXISTS idx_scan_logs_marshal ON public.scan_logs ("marshalName");
CREATE INDEX IF NOT EXISTS idx_scan_logs_time ON public.scan_logs ("scannedAt");

ALTER TABLE public.gate_marshals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read gate_marshals" ON public.gate_marshals;
DROP POLICY IF EXISTS "Allow service role all gate_marshals" ON public.gate_marshals;
CREATE POLICY "Allow public read gate_marshals" ON public.gate_marshals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow service role all gate_marshals" ON public.gate_marshals FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow public read scan_logs" ON public.scan_logs;
DROP POLICY IF EXISTS "Allow public insert scan_logs" ON public.scan_logs;
DROP POLICY IF EXISTS "Allow service role all scan_logs" ON public.scan_logs;
CREATE POLICY "Allow public read scan_logs" ON public.scan_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert scan_logs" ON public.scan_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow service role all scan_logs" ON public.scan_logs FOR ALL TO service_role USING (true);

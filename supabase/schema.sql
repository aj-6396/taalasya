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
  "paymentId" TEXT,
  "orderId" TEXT,
  "amount" NUMERIC DEFAULT 299,
  "status" TEXT NOT NULL DEFAULT 'Valid',
  "eventName" TEXT DEFAULT 'JHOOM ''26 — Dance Fest cum Dandiya Night',
  "idCardUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  "usedAt" TIMESTAMPTZ
);

-- Ensure idCardUrl column exists if table was already created
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "idCardUrl" TEXT;

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

-- =========================================================
-- NABTA SALES REPORT - FULL SUPABASE SCHEMA v2
-- Run this in your Supabase SQL Editor
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    date TEXT NOT NULL,
    client_name TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    client_price NUMERIC NOT NULL DEFAULT 0,
    nabta_bill NUMERIC NOT NULL DEFAULT 0,
    client_bill NUMERIC NOT NULL DEFAULT 0,
    jahed_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    paid_status TEXT DEFAULT 'Unpaid',
    amount_received NUMERIC DEFAULT 0,
    created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date);

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    reason TEXT NOT NULL DEFAULT 'Paid',
    payment_method TEXT DEFAULT 'Cash',
    recipient TEXT DEFAULT '',
    created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);

-- 3. DAY SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.day_summaries (
    date TEXT PRIMARY KEY,
    nabta_yesterday_balance NUMERIC NOT NULL DEFAULT 0,
    jahed_balance NUMERIC NOT NULL DEFAULT 0,
    paid NUMERIC NOT NULL DEFAULT 0,
    nabta_today_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- 4. NABTA TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.nabta_tokens (
    token TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Nabta Shareable Link',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- 5. ROW LEVEL SECURITY — Allow anon access (single-admin internal app)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nabta_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_payments" ON public.payments;
DROP POLICY IF EXISTS "anon_summaries" ON public.day_summaries;
DROP POLICY IF EXISTS "anon_tokens" ON public.nabta_tokens;

CREATE POLICY "anon_orders" ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_payments" ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_summaries" ON public.day_summaries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_tokens" ON public.nabta_tokens FOR ALL TO anon USING (true) WITH CHECK (true);

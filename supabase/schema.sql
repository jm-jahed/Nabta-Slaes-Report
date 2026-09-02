-- =========================================================
-- SALES & PAYMENT REPORTS - SUPABASE DATABASE SCHEMA
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_name TEXT NOT NULL,
    qty NUMERIC NOT NULL CHECK (qty >= 0),
    cost_price NUMERIC NOT NULL CHECK (cost_price >= 0),
    client_price NUMERIC NOT NULL CHECK (client_price >= 0),
    nabta_bill NUMERIC GENERATED ALWAYS AS (qty * cost_price) STORED,
    client_bill NUMERIC GENERATED ALWAYS AS (qty * client_price) STORED,
    jahed_balance NUMERIC GENERATED ALWAYS AS ((qty * client_price) - (qty * cost_price)) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast queries by date and client
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_name);

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    reason TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Cash',
    recipient TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date DESC);

-- 3. DAY SUMMARY TABLE
CREATE TABLE IF NOT EXISTS public.day_summaries (
    date DATE PRIMARY KEY,
    nabta_yesterday_balance NUMERIC NOT NULL DEFAULT 0,
    jahed_balance NUMERIC NOT NULL DEFAULT 0,
    paid NUMERIC NOT NULL DEFAULT 0,
    nabta_today_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    is_locked BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS POLICIES (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_summaries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (Admin) full access
CREATE POLICY "Allow authenticated admin full access to orders" 
ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to payments" 
ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to day_summaries" 
ON public.day_summaries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read/write if using anon key in single-admin internal setup
CREATE POLICY "Allow anon read/write for demo if configured"
ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for payments"
ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for day_summaries"
ON public.day_summaries FOR ALL TO anon USING (true) WITH CHECK (true);

-- =========================================================
-- OPTIONAL SAMPLE SEED DATA
-- =========================================================
INSERT INTO public.orders (date, client_name, qty, cost_price, client_price)
VALUES 
    (CURRENT_DATE, 'Al Noor Trading LLC', 100, 4.00, 5.00),
    (CURRENT_DATE, 'Dubai Marina Logistics', 250, 3.50, 4.50),
    (CURRENT_DATE, 'Gulf Falcon Corp', 50, 6.00, 8.00),
    (CURRENT_DATE - INTERVAL '1 day', 'Emirates General Stores', 120, 4.00, 5.20),
    (CURRENT_DATE - INTERVAL '1 day', 'Al Barsha Mart', 80, 5.00, 6.50)
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (date, amount, reason, payment_method)
VALUES 
    (CURRENT_DATE, 150.00, 'Nabta Office Courier & Supplies', 'Cash'),
    (CURRENT_DATE - INTERVAL '1 day', 200.00, 'Transportation fuel payout', 'Bank Transfer')
ON CONFLICT DO NOTHING;

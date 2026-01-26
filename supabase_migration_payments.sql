-- Create table for Payments (Financeiro)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    description TEXT NOT NULL, -- "Mensalidade Janeiro", "Kimono", etc
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT DEFAULT 'Pending', -- Pending, Paid, Overdue, Cancelled
    type TEXT DEFAULT 'Monthly', -- Monthly, Product, Registration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.payments FOR ALL USING (true);

-- Seed some example payments
-- Note: You might need to adjust member_ids manually if you run this, or let the UI create them

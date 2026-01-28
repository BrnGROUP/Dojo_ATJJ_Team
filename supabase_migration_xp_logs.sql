
-- Migration: Create XP Logs table
-- This table stores all XP changes (gains and losses) for members

CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Can be positive or negative
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID DEFAULT auth.uid()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_xp_logs_member_id ON public.xp_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON public.xp_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access on xp_logs" ON public.xp_logs;

-- Create permissive policy (refine later based on roles)
CREATE POLICY "Allow all access on xp_logs" ON public.xp_logs FOR ALL USING (true);

-- Ensure members table has xp column (should already exist, but just in case)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

COMMENT ON TABLE public.xp_logs IS 'Stores all XP transactions for members, including manual adjustments, attendance bonuses, and competition rewards';
COMMENT ON COLUMN public.xp_logs.amount IS 'XP change amount - positive for gains, negative for losses';
COMMENT ON COLUMN public.xp_logs.reason IS 'Description of why XP was added or removed';

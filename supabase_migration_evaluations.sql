
-- Create evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Técnica', 'Física', 'Comportamental', 'Exame de Faixa')),
    status TEXT NOT NULL CHECK (status IN ('Aprovado', 'Reprovado', 'Pendente')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    belt_snapshot TEXT, -- The belt the student had at the time of evaluation
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow all access on evaluations" ON public.evaluations;
CREATE POLICY "Allow all access on evaluations" ON public.evaluations FOR ALL USING (true);

-- Add XP reward trigger for approved evaluations?
-- For now we'll handle this in the frontend to keep logic flexible, 
-- but we ensure the table is ready.

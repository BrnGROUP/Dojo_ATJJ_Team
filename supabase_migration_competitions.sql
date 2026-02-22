-- Tabela: competitions
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization TEXT, -- IBJJF, CBJJ, Local, etc.
    description TEXT,
    date DATE NOT NULL,
    location TEXT,
    status TEXT CHECK (status IN ('Scheduled', 'Ongoing', 'Finished', 'Cancelled')) DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: competition_registrations (Relaciona alunos a competições e seus resultados)
CREATE TABLE IF NOT EXISTS public.competition_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    category TEXT, -- Faixa, Peso, Idade
    result TEXT CHECK (result IN ('Gold', 'Silver', 'Bronze', 'Participation', 'Winner', 'None')) DEFAULT 'None',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competition_id, member_id)
);

-- Habilitar RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "authenticated_view_competitions" ON public.competitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_manage_competitions" ON public.competitions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'coordinator')));

CREATE POLICY "authenticated_view_registrations" ON public.competition_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_manage_registrations" ON public.competition_registrations FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'coordinator')));

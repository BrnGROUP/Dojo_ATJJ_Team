-- Gamification System for ATJJ Dojo v4

-- 1. Belts (Faixas)
CREATE TABLE IF NOT EXISTS public.belts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- Hex code
    min_xp INTEGER DEFAULT 0 NOT NULL,
    requirements TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Badges (Insígnias)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Presence', 'Technical', 'Behavior', 'Achievement', 'Special'
    level TEXT NOT NULL, -- 'Bronze', 'Prata', 'Ouro', 'Diamante'
    icon TEXT, -- Material Symbol name
    xp_reward INTEGER DEFAULT 0 NOT NULL,
    criteria_type TEXT, -- 'consecutive_presence', 'total_presence', 'manual'
    criteria_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Member Badges (Junction)
CREATE TABLE IF NOT EXISTS public.member_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(member_id, badge_id)
);

-- 4. XP Logs (Tracking)
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.belts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all access on belts" ON public.belts FOR ALL USING (true);
CREATE POLICY "Allow all access on badges" ON public.badges FOR ALL USING (true);
CREATE POLICY "Allow all access on member_badges" ON public.member_badges FOR ALL USING (true);
CREATE POLICY "Allow all access on xp_logs" ON public.xp_logs FOR ALL USING (true);

-- Seed Initial Belts
INSERT INTO public.belts (name, color, min_xp, order_index) VALUES
('Branca', '#FFFFFF', 0, 1),
('Azul', '#0000FF', 1000, 2),
('Roxa', '#A020F0', 3000, 3),
('Marrom', '#5C4033', 6000, 4),
('Preta', '#000000', 10000, 5);

-- Seed Initial Badges
INSERT INTO public.badges (name, description, category, level, icon, xp_reward, criteria_type, criteria_value) VALUES
('Assíduo Bronze', '10 presenças consecutivas', 'Presence', 'Bronze', 'calendar_today', 50, 'consecutive_presence', 10),
('Técnico Iniciante', 'Demonstrou domínio das passagens básicas', 'Technical', 'Bronze', 'school', 100, 'manual', 0),
('Guerreiro de Tatame', 'Nunca falta aos treinos de sexta', 'Special', 'Prata', 'shield', 150, 'total_presence', 20),
('Comportamento Exemplar', 'Respeito e disciplina acima da média', 'Behavior', 'Ouro', 'self_improvement', 200, 'manual', 0);

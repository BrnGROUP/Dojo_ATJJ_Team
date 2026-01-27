-- 1. Ensure 'belts' table exists and has all columns
CREATE TABLE IF NOT EXISTS public.belts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- Main color (Hex)
    color_secondary TEXT, -- Secondary color for bicolor/kids belts (optional)
    min_xp INTEGER DEFAULT 0 NOT NULL,
    requirements TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix: Add color_secondary if it doesn't exist (in case table already existed)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='belts' AND column_name='color_secondary') THEN
        ALTER TABLE public.belts ADD COLUMN color_secondary TEXT;
    END IF;
END $$;

-- 2. Ensure 'badges' table exists
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    icon TEXT,
    xp_reward INTEGER DEFAULT 0 NOT NULL,
    criteria_type TEXT,
    criteria_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ensure 'member_badges' table exists
CREATE TABLE IF NOT EXISTS public.member_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(member_id, badge_id)
);

-- 4. Ensure 'xp_logs' table exists
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ALTER 'members' table to add gamification columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='xp') THEN
        ALTER TABLE public.members ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='belt') THEN
        ALTER TABLE public.members ADD COLUMN belt TEXT DEFAULT 'Branca';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='stripes') THEN
        ALTER TABLE public.members ADD COLUMN stripes INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='cpf') THEN
        ALTER TABLE public.members ADD COLUMN cpf TEXT;
    END IF;
END $$;

-- 6. Fix 'attendance' table columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='on_time') THEN
        ALTER TABLE public.attendance ADD COLUMN on_time BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='good_behavior') THEN
        ALTER TABLE public.attendance ADD COLUMN good_behavior BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 7. Enable RLS and add basic policies
ALTER TABLE public.belts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for management
DROP POLICY IF EXISTS "Allow all access on belts" ON public.belts;
CREATE POLICY "Allow all access on belts" ON public.belts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access on badges" ON public.badges;
CREATE POLICY "Allow all access on badges" ON public.badges FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access on member_badges" ON public.member_badges;
CREATE POLICY "Allow all access on member_badges" ON public.member_badges FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access on xp_logs" ON public.xp_logs;
CREATE POLICY "Allow all access on xp_logs" ON public.xp_logs FOR ALL USING (true);

-- 8. Ensure 'attendance' table and policies
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Present' NOT NULL,
    on_time BOOLEAN DEFAULT false,
    good_behavior BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, member_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all access" ON public.attendance;
CREATE POLICY "Allow all access on attendance" ON public.attendance FOR ALL USING (true);

-- 7. Seed initial belts including Kids sequence
-- Values: (Name, Main Color, Secondary Color, Min XP, Order)
INSERT INTO public.belts (name, color, color_secondary, min_xp, order_index)
SELECT name, color, color_secondary, min_xp, order_index FROM (
    VALUES 
    ('Branca', '#FFFFFF', NULL, 0, 1),
    
    -- Kids Sequence (Gray/Yellow/Orange/Green)
    ('Cinza c/ Branco', '#808080', '#FFFFFF', 100, 2),
    ('Cinza', '#808080', NULL, 200, 3),
    ('Cinza c/ Preto', '#808080', '#000000', 300, 4),
    
    ('Amarela c/ Branco', '#FFFF00', '#FFFFFF', 400, 5),
    ('Amarela', '#FFFF00', NULL, 600, 6),
    ('Amarela c/ Preto', '#FFFF00', '#000000', 800, 7),
    
    ('Laranja c/ Branco', '#FFA500', '#FFFFFF', 1000, 8),
    ('Laranja', '#FFA500', NULL, 1200, 9),
    ('Laranja c/ Preto', '#FFA500', '#000000', 1500, 10),
    
    ('Verde c/ Branco', '#008000', '#FFFFFF', 1800, 11),
    ('Verde', '#008000', NULL, 2200, 12),
    ('Verde c/ Preto', '#008000', '#000000', 2600, 13),
    
    -- Adult Sequence
    ('Azul', '#0000FF', NULL, 3500, 14),
    ('Roxa', '#A020F0', NULL, 5500, 15),
    ('Marrom', '#5C4033', NULL, 8000, 16),
    ('Preta', '#000000', NULL, 12000, 17)
) as t(name, color, color_secondary, min_xp, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.belts LIMIT 1);

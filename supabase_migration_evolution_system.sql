-- ============================================================
-- MIGRAÇÃO: Sistema de Evolução Completo (Kyu/Dan)
-- Executar no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar campo de label Kyu/Dan na tabela belts
ALTER TABLE public.belts ADD COLUMN IF NOT EXISTS kyu_dan_label TEXT DEFAULT NULL;
ALTER TABLE public.belts ADD COLUMN IF NOT EXISTS color_secondary TEXT DEFAULT NULL;

-- 2. Adicionar progressão de faixas nas turmas (array de belt IDs)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS belt_progression UUID[] DEFAULT '{}';

-- 3. Adicionar override de próxima faixa no membro
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS next_belt_override UUID DEFAULT NULL;

-- 4. Tabela de Requisitos por Faixa (Critérios de Promoção)
CREATE TABLE IF NOT EXISTS public.belt_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    belt_id UUID NOT NULL REFERENCES public.belts(id) ON DELETE CASCADE,
    min_total_xp INTEGER DEFAULT 0,
    min_attendance INTEGER DEFAULT 0,
    min_technique_domina_pct INTEGER DEFAULT 50,
    min_technique_executa_pct INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(belt_id)
);

-- RLS
ALTER TABLE public.belt_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access on belt_requirements" ON public.belt_requirements FOR ALL USING (true);

-- 5. Seed default requirements (exemplo para faixas básicas)
-- Primeiro pegamos os IDs das faixas existentes
DO $$
DECLARE
    branca_id UUID;
    azul_id UUID;
    roxa_id UUID;
    marrom_id UUID;
BEGIN
    SELECT id INTO branca_id FROM public.belts WHERE name = 'Branca' LIMIT 1;
    SELECT id INTO azul_id FROM public.belts WHERE name = 'Azul' LIMIT 1;
    SELECT id INTO roxa_id FROM public.belts WHERE name = 'Roxa' LIMIT 1;
    SELECT id INTO marrom_id FROM public.belts WHERE name = 'Marrom' LIMIT 1;

    -- Branca -> evolui quando atingir critérios (para a próxima faixa)
    IF branca_id IS NOT NULL THEN
        INSERT INTO public.belt_requirements (belt_id, min_total_xp, min_attendance, min_technique_domina_pct, min_technique_executa_pct)
        VALUES (branca_id, 600, 30, 50, 50)
        ON CONFLICT (belt_id) DO NOTHING;
    END IF;

    IF azul_id IS NOT NULL THEN
        INSERT INTO public.belt_requirements (belt_id, min_total_xp, min_attendance, min_technique_domina_pct, min_technique_executa_pct)
        VALUES (azul_id, 2000, 80, 60, 60)
        ON CONFLICT (belt_id) DO NOTHING;
    END IF;

    IF roxa_id IS NOT NULL THEN
        INSERT INTO public.belt_requirements (belt_id, min_total_xp, min_attendance, min_technique_domina_pct, min_technique_executa_pct)
        VALUES (roxa_id, 4000, 150, 70, 70)
        ON CONFLICT (belt_id) DO NOTHING;
    END IF;

    IF marrom_id IS NOT NULL THEN
        INSERT INTO public.belt_requirements (belt_id, min_total_xp, min_attendance, min_technique_domina_pct, min_technique_executa_pct)
        VALUES (marrom_id, 7000, 250, 80, 75)
        ON CONFLICT (belt_id) DO NOTHING;
    END IF;
END $$;

-- 6. Atualizar labels Kyu/Dan nas faixas existentes
UPDATE public.belts SET kyu_dan_label = '9º Kyu' WHERE name = 'Branca' AND kyu_dan_label IS NULL;
UPDATE public.belts SET kyu_dan_label = '3º Kyu' WHERE name = 'Azul' AND kyu_dan_label IS NULL;
UPDATE public.belts SET kyu_dan_label = '2º Kyu' WHERE name = 'Roxa' AND kyu_dan_label IS NULL;
UPDATE public.belts SET kyu_dan_label = '1º Kyu' WHERE name = 'Marrom' AND kyu_dan_label IS NULL;
UPDATE public.belts SET kyu_dan_label = '1º Dan' WHERE name = 'Preta' AND kyu_dan_label IS NULL;

-- ============================================================
-- MIGRAÇÃO: Sistema de Insígnias v2 (Integração Completa)
-- Executar no SQL Editor do Supabase
-- ============================================================

-- 1. Novos campos na tabela de badges para controle avançado
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS badge_group TEXT DEFAULT NULL;

-- badge_group: Agrupa badges da mesma "família" (ex: "assiduo", "guerreiro")
-- Quando um aluno conquista nível superior, o inferior é substituído.

COMMENT ON COLUMN public.badges.badge_group IS 'Identifies badge family for level progression (e.g. assiduo). Only one level per group per member.';
COMMENT ON COLUMN public.badges.is_active IS 'Soft-delete flag. Inactive badges are hidden from new awards.';

-- 2. Novos campos na tabela member_badges
ALTER TABLE public.member_badges
  ADD COLUMN IF NOT EXISTS awarded_by UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS awarded_note TEXT DEFAULT NULL;

COMMENT ON COLUMN public.member_badges.awarded_by IS 'Profile ID of the instructor/admin who awarded the badge (NULL = system auto-award).';
COMMENT ON COLUMN public.member_badges.awarded_note IS 'Optional note from the instructor when awarding manually.';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_member_badges_member_id ON public.member_badges(member_id);
CREATE INDEX IF NOT EXISTS idx_member_badges_badge_id ON public.member_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_group ON public.badges(badge_group);
CREATE INDEX IF NOT EXISTS idx_badges_criteria ON public.badges(criteria_type);

-- 4. Atualizar badges seed existentes com badge_group
UPDATE public.badges SET badge_group = 'assiduo' WHERE name ILIKE '%Assíduo%' AND badge_group IS NULL;
UPDATE public.badges SET badge_group = 'guerreiro_tatame' WHERE name ILIKE '%Guerreiro%' AND badge_group IS NULL;
UPDATE public.badges SET badge_group = 'tecnico_iniciante' WHERE name ILIKE '%Técnico Iniciante%' AND badge_group IS NULL;
UPDATE public.badges SET badge_group = 'comportamento' WHERE name ILIKE '%Comportamento%' AND badge_group IS NULL;

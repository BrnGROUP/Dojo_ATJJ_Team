-- =================================================================================
-- MIGRAÇÃO: SISTEMA DE AVALIAÇÃO CURRICULAR (CHECKLIST TÉCNICO)
-- Arquivo: supabase_migration_curriculum.sql
-- =================================================================================

-- 1. Criação da tabela 'techniques' (Catálogo de técnicas por faixa)
CREATE TABLE IF NOT EXISTS public.techniques (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    belt_id UUID NOT NULL REFERENCES public.belts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Ex: 'Base & Movimento', 'Quedas & Projeções', etc.
    subcategory TEXT,
    description TEXT,
    video_url TEXT,
    image_url TEXT,
    pedagogical_layer TEXT DEFAULT 'Técnica',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criação da tabela de junção 'member_techniques' (Progresso do aluno por técnica)
CREATE TABLE IF NOT EXISTS public.member_techniques (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    technique_id UUID NOT NULL REFERENCES public.techniques(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_seen', -- Valores: 'not_seen', 'learning', 'with_help', 'alone', 'mastered'
    checked BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Um aluno só pode ter um registro de progresso por técnica
    UNIQUE(member_id, technique_id)
);

-- 3. Adicionar permissões RLS (Row Level Security) para as novas tabelas
ALTER TABLE public.techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_techniques ENABLE ROW LEVEL SECURITY;

-- Políticas para 'techniques' (Acesso total para simplificar, ajuste conforme as roles do seu sistema)
CREATE POLICY "Enable ALL for authenticated users on techniques"
    ON public.techniques FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para 'member_techniques'
CREATE POLICY "Enable ALL for authenticated users on member_techniques"
    ON public.member_techniques FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Função para atualizar o 'updated_at' automaticamente (se não existir)
-- (Sua base já deve ter a function moddatetime, caso contrário crie via extensions ou functions)
-- CREATE EXTENSION IF NOT EXISTS moddatetime;
-- CREATE TRIGGER handle_updated_at_techniques BEFORE UPDATE ON public.techniques FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);
-- CREATE TRIGGER handle_updated_at_member_techniques BEFORE UPDATE ON public.member_techniques FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- 5. Opcional - Inserir exemplo apenas para teste (Substitua por um belt_id real da sua tabela 'belts' se quiser testar)
/*
DO $$
DECLARE
    branca_id UUID;
BEGIN
    SELECT id INTO branca_id FROM public.belts WHERE name ILIKE '%Branca%' LIMIT 1;
    
    IF branca_id IS NOT NULL THEN
        INSERT INTO public.techniques (belt_id, name, category, pedagogical_layer)
        VALUES 
        (branca_id, 'Postura de Combate', 'Base & Movimento', 'Técnica'),
        (branca_id, 'Queda de Costas', 'Base & Movimento', 'Motora'),
        (branca_id, 'Fuga de Quadril', 'Base & Movimento', 'Motora')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
*/

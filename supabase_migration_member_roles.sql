-- Atualização da estrutura de membros e usuários
-- 1. Adicionar tipo de membro e vínculo com usuário do sistema
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'student';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Criar um índice para busca rápida por tipo
CREATE INDEX IF NOT EXISTS idx_members_type ON public.members(type);

-- 3. Comentários para documentação
COMMENT ON COLUMN public.members.type IS 'Tipo do membro: student, instructor, teacher, staff';
COMMENT ON COLUMN public.members.user_id IS 'ID do usuário correspondente em auth.users para acesso ao sistema';

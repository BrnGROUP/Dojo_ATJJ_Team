-- SCRIPT DEFINITIVO PARA CORRIGIR RECURSÃO E ACESSO

-- 1. Desativar RLS temporariamente para limpeza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Limpar tudo
DROP POLICY IF EXISTS "Leitura pública para autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Auto-edição" ON public.profiles;
DROP POLICY IF EXISTS "Acesso total Administradores" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.is_admin();

-- 3. Criar função de verificação segura (SECURITY DEFINER ignora RLS interno)
CREATE OR REPLACE FUNCTION public.check_is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'manager')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ADICIONA COLUNAS EXTRAS (SE NÃO EXISTIREM)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 5. RE-HABILITA RLS E VERIFICA PERMISSÕES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- POLÍTICAS SIMPLIFICADAS E SEM RECURSÃO

-- Regra 1: Qualquer um logado pode ver os perfis (evita erro na lista)
CREATE POLICY "visualizacao_geral" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Regra 2: O próprio usuário pode se atualizar
CREATE POLICY "auto_gestao" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Regra 3: Admins podem fazer TUDO (Usando o email como bypass de segurança para evitar recursion)
CREATE POLICY "admin_master_total" 
ON public.profiles FOR ALL 
TO authenticated 
USING (
  (auth.jwt() ->> 'email') LIKE 'claudio.bruno%' 
  OR 
  (auth.jwt() ->> 'email') = 'admin@atjj.com'
  OR
  check_is_admin()
);

-- 6. Garantir que a estrutura está correta
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'student';

-- 7. Criar perfil caso não exista para o usuário atual (Opcional, mas ajuda)
-- Você pode rodar isso se souber seu UUID:
-- INSERT INTO public.profiles (id, full_name, email, role) 
-- VALUES ('SEU-UUID-AQUI', 'Claudio Bruno', 'claudio.bruno095@gmail.com', 'admin')
-- ON CONFLICT (id) DO NOTHING;

-- 5. Inserir manualmente o perfil do admin caso ele falte (substitua o ID se souber, mas o upsert no app cuidará disso)
-- Este comando é opcional se você clicar em "Salvar" no App.

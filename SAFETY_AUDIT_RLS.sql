-- SAFETY AUDIT RLS: Roteiro para Segurança Máxima (Supabase)

-- 1. LIMPEZA DE POLÍTICAS "FAZER TUDO" (Aquelas que usam USING(true))
DROP POLICY IF EXISTS "Allow all access" ON public.groups;
DROP POLICY IF EXISTS "Allow all access" ON public.members;
DROP POLICY IF EXISTS "Allow all access" ON public.payments;
DROP POLICY IF EXISTS "Allow all access" ON public.attendance;

-- 2. FUNÇÕES DE SUPORTE PARA VERIFICAÇÃO DE CARGO
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. POLÍTICAS PARA TURMAS (GROUPS)
-- Todos os logados podem ver as turmas, apenas Admins/Gerentes editam
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_view_groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_groups" ON public.groups FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'manager'));

-- 4. POLÍTICAS PARA MEMBROS (ALUNOS)
-- Apenas Staff pode ver e gerenciar alunos (conforme solicitação de privacidade)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_manage_members" ON public.members FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'manager', 'coordinator', 'instructor'));

-- 5. POLÍTICAS PARA FINANCEIRO (PAYMENTS)
-- Apenas Admin e Gerente acessam o financeiro
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_finance" ON public.payments FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'manager'));

-- 6. POLÍTICAS PARA FREQUÊNCIA (ATTENDANCE)
-- Staff gerencia presenças
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_manage_attendance" ON public.attendance FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'manager', 'coordinator', 'instructor'));

-- 7. NOTIFICA O POSTGREST PARA RECARREGAR O ESQUEMA
NOTIFY pgrst, 'reload schema';

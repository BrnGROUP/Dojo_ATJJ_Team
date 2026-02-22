-- Migração para criação da tabela de configurações (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dojo_name TEXT DEFAULT 'ATJJ Dojo',
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    cep TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Apenas Admins podem gerenciar configurações
CREATE POLICY "admin_manage_settings" ON public.settings FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Todos os autenticados podem ver o nome do Dojo e info básica (opcional)
CREATE POLICY "authenticated_view_settings" ON public.settings FOR SELECT TO authenticated USING (true);

-- Inserir registro padrão se não existir
INSERT INTO public.settings (dojo_name) 
SELECT 'ATJJ Dojo v4'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

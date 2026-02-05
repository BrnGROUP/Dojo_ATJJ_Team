-- 1. LIMPEZA TOTAL DE FUNÇÕES ANTIGAS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. GARANTIR QUE A TABELA PROFILES EXISTE E ESTÁ LIMPA
-- (Cuidado: isso apaga perfis criados antes, mas resolve o erro de esquema)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CRIAR A FUNÇÃO DE PERFIL COM PERMISSÕES EXPLÍCITAS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    new.email, 
    'admin' -- Define como admin por padrão durante os testes
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$;

-- 4. RE-ATIVAR O GATILHO
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. DAR PERMISSÃO PARA O SISTEMA DE AUTENTICAÇÃO
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

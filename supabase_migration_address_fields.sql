-- Adicionar colunas faltantes para endereçamento detalhado
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS cep TEXT;

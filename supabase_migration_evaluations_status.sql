-- =================================================================================
-- MIGRAÇÃO: ADICIONAR STATUS 'Cancelado' NA TABELA evaluations
-- Arquivo: supabase_migration_evaluations_status.sql
-- =================================================================================

-- 1. Remover a restrição (constraint) antiga se ela existir (normalmente chamada evaluations_status_check)
-- Se não souber o nome exato da constraint, a instrução abaixo pode falhar sem afetar o resto
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_status_check;

-- 2. Recriar a constraint permitindo o valor 'Cancelado'
ALTER TABLE public.evaluations 
ADD CONSTRAINT evaluations_status_check 
CHECK (status IN ('Aprovado', 'Reprovado', 'Pendente', 'Cancelado'));

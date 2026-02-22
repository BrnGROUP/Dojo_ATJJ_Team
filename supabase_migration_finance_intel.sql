-- Migração para Controle Financeiro e Melhoria de Perfil
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) DEFAULT 150.00;

-- Função para listar alunos com mensalidade pendente (simplificada para o mês atual)
CREATE OR REPLACE FUNCTION public.get_pending_members()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    belt TEXT,
    billing_day INTEGER,
    monthly_fee NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.full_name, m.belt, m.billing_day, m.monthly_fee
    FROM public.members m
    WHERE m.status = 'Active'
    AND NOT EXISTS (
        SELECT 1 
        FROM public.payments p 
        WHERE p.member_id = m.id 
        AND p.type = 'Mensalidade'
        AND p.status = 'Paid'
        AND EXTRACT(MONTH FROM p.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM p.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    )
    AND m.billing_day <= EXTRACT(DAY FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

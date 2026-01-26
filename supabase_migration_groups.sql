-- Create table for Class Groups (Turmas)
-- Use this to manage the types of classes students can enroll in
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    schedule_description TEXT, -- e.g. "Seg/Qua/Sex 19:00"
    color TEXT DEFAULT 'blue', -- blue, purple, etc for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed defaults
INSERT INTO public.groups (name, description, schedule_description, color) VALUES
('Fundamentos (Iniciantes)', 'Aulas focadas em base e defesa pessoal', 'Seg/Qua 18:00', 'white'),
('Técnicas Avançadas', 'Aulas de competição e sparring', 'Ter/Qui 20:00', 'blue'),
('Especialista No-Gi', 'Jiu-Jitsu sem kimono', 'Sex 19:00', 'purple'),
('Programa Infantil', 'Para crianças de 5 a 12 anos', 'Seg/Qua 17:00', 'green');

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.groups FOR ALL USING (true);

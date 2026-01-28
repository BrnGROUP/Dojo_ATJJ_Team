
-- Add lesson_plan column to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS lesson_plan TEXT;


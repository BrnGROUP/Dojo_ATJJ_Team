-- Run this in your Supabase SQL Editor

-- 1. Add the column for multiple classes
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS enrolled_classes TEXT[] DEFAULT '{}';

-- 2. Migrate existing 'plan' data to the new column (optional)
UPDATE public.members 
SET enrolled_classes = ARRAY[plan] 
WHERE plan IS NOT NULL AND enrolled_classes = '{}';

-- 3. (Optional) If you want to keep 'plan' for billing cycles (e.g. Monthly)
-- UPDATE public.members SET plan = 'Mensal' WHERE plan IN ('fundamentals', 'advanced', 'nogi', 'kids');

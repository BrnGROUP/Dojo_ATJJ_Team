-- Create table for Attendance (Frequência)
-- Use this to track student presence in specific classes
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Present' NOT NULL, -- 'Present', 'Absent', 'Excused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, member_id) -- A student can only have one attendance record per class
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Simple policy for the daskboard v4 (allowing all authenticated access for simplicity in this project)
CREATE POLICY "Allow all access" ON public.attendance FOR ALL USING (true);

-- Optional: Index for better performance
CREATE INDEX idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX idx_attendance_member_id ON public.attendance(member_id);

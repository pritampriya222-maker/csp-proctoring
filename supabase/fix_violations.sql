-- Drop existing table
DROP TABLE IF EXISTS public.exam_violations;

-- Recreate with correct columns
CREATE TABLE public.exam_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE NOT NULL,
  violation_type TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exam_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can insert own violations." ON public.exam_violations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = session_id AND student_id = auth.uid())
);
CREATE POLICY "Admins can view all violations." ON public.exam_violations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Migration to support dynamic exam configuration and randomization

-- 1. Add difficulty to exam_questions
ALTER TABLE public.exam_questions 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 2. Add configuration and status to exams
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS easy_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medium_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hard_count INTEGER DEFAULT 0;

-- 3. Create session_questions table to store the randomized set for each student
CREATE TABLE public.session_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.exam_questions(id) ON DELETE CASCADE NOT NULL,
  "order" INTEGER NOT NULL,
  UNIQUE(session_id, question_id)
);

ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own session questions." ON public.session_questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exam_sessions 
    WHERE id = session_id AND student_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage session questions." ON public.session_questions
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create exam_questions table
CREATE TABLE public.exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'subjective')),
  question_text TEXT NOT NULL,
  options JSONB, -- Array of strings for MCQ options
  correct_answer TEXT, -- Optional for subjective
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by everyone." ON public.exam_questions FOR SELECT USING (true);
CREATE POLICY "Admins can insert questions." ON public.exam_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update questions." ON public.exam_questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete questions." ON public.exam_questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drop the existing insert policy on exams
DROP POLICY IF EXISTS "Admins can create exams." ON public.exams;

-- Recreate policy checking explicit created_by matching auth.uid() and role
CREATE POLICY "Admins can create exams." ON public.exams FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Also add an UPDATE and DELETE policy just in case the UI needs it later
DROP POLICY IF EXISTS "Admins can update exams." ON public.exams;
CREATE POLICY "Admins can update exams." ON public.exams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete exams." ON public.exams;
CREATE POLICY "Admins can delete exams." ON public.exams FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

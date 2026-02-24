-- Update questions missing a type
UPDATE public.exam_questions 
SET type = 'subjective' 
WHERE type IS NULL AND (options IS NULL OR jsonb_array_length(options) = 0);

UPDATE public.exam_questions 
SET type = 'mcq' 
WHERE type IS NULL AND options IS NOT NULL AND jsonb_array_length(options) > 0;

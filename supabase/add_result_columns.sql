-- Run this in your Supabase SQL Editor to support the new Status and Results features

ALTER TABLE public.exam_sessions
DROP CONSTRAINT IF EXISTS exam_sessions_status_check;

ALTER TABLE public.exam_sessions
ADD CONSTRAINT exam_sessions_status_check CHECK (status IN ('in_progress', 'completed', 'terminated', 'under_review', 'IN_PROGRESS', 'COMPLETED', 'UNDER_REVIEW', 'NOT_ATTEMPTED'));

ALTER TABLE public.exam_sessions
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspicion_level TEXT DEFAULT 'SAFE';

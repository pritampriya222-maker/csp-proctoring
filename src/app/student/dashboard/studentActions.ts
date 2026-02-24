'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function initializeStudentSession(examId: string) {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Check if session already exists
  const { data: existingSession } = await supabase
    .from('exam_sessions')
    .select('id, status')
    .eq('exam_id', examId)
    .eq('student_id', user.id)
    .single()

  if (existingSession) {
    return { sessionId: existingSession.id }
  }

  // 3. Get exam configuration
  const { data: exam } = await supabase
    .from('exams')
    .select('easy_count, medium_count, hard_count, is_published')
    .eq('id', examId)
    .single()

  if (!exam || !exam.is_published) {
    throw new Error('Exam is not authorized for start.')
  }

  // 4. Create session
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .insert({
      exam_id: examId,
      student_id: user.id,
      status: 'in_progress'
    })
    .select()
    .single()

  if (sessionError) throw new Error(sessionError.message)

  // 5. Randomly pick questions based on difficulty
  const difficulties = [
    { type: 'easy', count: exam.easy_count },
    { type: 'medium', count: exam.medium_count },
    { type: 'hard', count: exam.hard_count }
  ]

  const selectedQuestionIds: string[] = []

  for (const diff of difficulties) {
    if (diff.count > 0) {
      const { data: pool } = await supabase
        .from('exam_questions')
        .select('id')
        .eq('exam_id', examId)
        .eq('difficulty', diff.type)

      if (pool && pool.length > 0) {
        // Shuffle and pick
        const shuffled = pool.sort(() => 0.5 - Math.random())
        selectedQuestionIds.push(...shuffled.slice(0, diff.count).map(q => q.id))
      }
    }
  }

  // 6. Save randomized set to session_questions
  const sessionQuestions = selectedQuestionIds.map((qId, index) => ({
    session_id: session.id,
    question_id: qId,
    order: index + 1
  }))

  const { error: insertError } = await supabase
    .from('session_questions')
    .insert(sessionQuestions)

  if (insertError) throw new Error(insertError.message)

  revalidatePath('/student/dashboard')
  return { sessionId: session.id }
}

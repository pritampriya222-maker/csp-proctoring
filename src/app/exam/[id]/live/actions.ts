'use server'

import { createClient } from '@/utils/supabase/server'

export async function submitExam(sessionId: string, answers: Record<string, string>) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Get the session to find exam_id
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('exam_id')
    .eq('id', sessionId)
    .single()

  if (!session) return { success: false, error: 'Session not found' }

  // 2. Fetch correct answers
  const { data: questions } = await supabase
    .from('questions')
    .select('id, correct_answer')
    .eq('exam_id', session.exam_id)

  // 3. Calculate Score
  let score = 0
  const totalQuestions = questions?.length || 0

  if (questions) {
    questions.forEach(q => {
      // answers is an object like { [question.id]: 'A', ... }
      if (answers[q.id] === q.correct_answer) {
        score++
      }
    })
  }

  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0

  // 4. Calculate Violations & Suspicion
  const { count: violationCount } = await supabase
    .from('exam_violations')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const vCount = violationCount || 0
  let suspicion_level = 'SAFE'
  let finalStatus = 'COMPLETED'

  if (vCount > 5 && vCount <= 12) {
    suspicion_level = 'SUSPICIOUS'
  } else if (vCount > 12) {
    suspicion_level = 'UNDER_REVIEW'
    finalStatus = 'UNDER_REVIEW' // Entire exam status gets flagged
  }

  // 5. Update the session with final results
  const { error } = await supabase
    .from('exam_sessions')
    .update({ 
      status: finalStatus,
      ended_at: new Date().toISOString(),
      score: score,
      percentage: percentage,
      violation_count: vCount,
      suspicion_level: suspicion_level
    })
    .eq('id', sessionId)
    .eq('student_id', user.id) // Ensure they own the session

  if (error) {
    console.error('Failed to submit exam:', error)
    return { success: false, error: 'Failed to submit' }
  }

  return { success: true, redirect: `/student/exam/${session.exam_id}/result` }
}

export async function recordViolation(
  sessionId: string,
  type: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('exam_violations')
    .insert({
      session_id: sessionId,
      violation_type: type,
      description: description,
      severity: severity
    })

  if (error) {
    console.error('Failed to record violation:', error)
    return { success: false, error: 'Failed to record violation' }
  }

  return { success: true }
}

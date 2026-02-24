'use server'

import { createClient } from '@/utils/supabase/server'

export async function submitExam(sessionId: string, answers: Record<string, string>) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Save answers to session (we'll add an answers column or we can just mark completed for now)
  // For this version we will just mark the session as completed
  const { error } = await supabase
    .from('exam_sessions')
    .update({ 
      status: 'completed',
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('student_id', user.id) // Ensure they own the session

  if (error) {
    console.error('Failed to submit exam:', error)
    return { success: false, error: 'Failed to submit' }
  }

  return { success: true }
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

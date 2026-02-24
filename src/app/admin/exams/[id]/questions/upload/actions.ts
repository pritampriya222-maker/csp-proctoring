'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addQuestion(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const exam_id = formData.get('exam_id') as string
  const type = formData.get('type') as string
  const question_text = formData.get('question_text') as string
  const correct_answer = formData.get('correct_answer') as string

  let options = null
  if (type === 'mcq') {
    const optA = formData.get('option_a') as string
    const optB = formData.get('option_b') as string
    const optC = formData.get('option_c') as string
    const optD = formData.get('option_d') as string
    
    // Filter out empty options
    options = [optA, optB, optC, optD].filter(Boolean)
  }

  const { error } = await supabase
    .from('exam_questions')
    .insert({
      exam_id,
      type,
      question_text,
      options: options,
      correct_answer: correct_answer || null,
    })

  if (error) {
    console.error('Error adding question:', error)
    throw new Error('Failed to add question')
  }

  revalidatePath(`/admin/exams/${exam_id}`)
  redirect(`/admin/exams/${exam_id}`)
}

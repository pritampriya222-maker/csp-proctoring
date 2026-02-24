'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateExamConfig(examId: string, config: { easy: number, medium: number, hard: number }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('exams')
    .update({
      easy_count: config.easy,
      medium_count: config.medium,
      hard_count: config.hard
    })
    .eq('id', examId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/exams/${examId}`)
  return { success: true }
}

export async function toggleExamStatus(examId: string, isPublished: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('exams')
    .update({ is_published: isPublished })
    .eq('id', examId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/exams/${examId}`)
  revalidatePath('/admin')
  revalidatePath('/student/dashboard')
  return { success: true }
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExam(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const start_time = formData.get('start_time') as string
  const duration_minutes = parseInt(formData.get('duration_minutes') as string, 10)

  const startDate = new Date(start_time)
  const endDate = new Date(startDate.getTime() + duration_minutes * 60000)

  const { data: exam, error } = await supabase
    .from('exams')
    .insert({
      title,
      description,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating exam:', error)
    throw new Error(`Failed to create exam: ${error.message} (Details: ${error.details || ''} Hint: ${error.hint || ''})`)
  }

  revalidatePath('/admin')
  redirect(`/admin/exams/${exam.id}`)
}

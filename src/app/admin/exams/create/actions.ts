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
  const start_time = formData.get('start_time') as string // "YYYY-MM-DDTHH:MM"
  const duration_minutes = parseInt(formData.get('duration_minutes') as string, 10)
  const tzOffsetStr = formData.get('timezone_offset') as string || '0'
  const tzOffsetMinutes = parseInt(tzOffsetStr, 10) // e.g., -330 for IST

  // The 'start_time' comes in as 'YYYY-MM-DDTHH:MM' (local string representation).
  // new Date(start_time) will parse it as local time ON THE SERVER (which is UTC on Vercel).
  // So Vercel thinks the admin meant 10:54 UTC.
  const vercelParsedDate = new Date(start_time)
  
  // To get the TRUE absolute time the Admin meant, we must apply the difference
  // between Vercel's offset (usually 0) and the Admin's offset.
  // We simply adjust the milliseconds based on the Admin's browser offset.
  const absoluteStartTimeMs = vercelParsedDate.getTime() + (tzOffsetMinutes * 60000)
  
  const startDate = new Date(absoluteStartTimeMs)
  const endDate = new Date(absoluteStartTimeMs + duration_minutes * 60000)

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

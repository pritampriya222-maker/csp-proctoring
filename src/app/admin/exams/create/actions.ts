'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExam(formData: FormData) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login?error=Session expired')

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const start_time = formData.get('start_time') as string // "YYYY-MM-DDTHH:MM"
    const duration_minutes = parseInt(formData.get('duration_minutes') as string, 10)
    const tzOffsetStr = formData.get('timezone_offset') as string || '0'
    const tzOffsetMinutes = parseInt(tzOffsetStr, 10) // e.g., -330 for IST

    if (!start_time || isNaN(duration_minutes)) {
      throw new Error("Missing start time or duration.")
    }

    const neutralUtcDate = new Date(`${start_time}Z`)
    if (isNaN(neutralUtcDate.getTime())) {
      throw new Error("Invalid start time format natively passed.")
    }

    const trueUtcMs = neutralUtcDate.getTime() + (tzOffsetMinutes * 60000)
    
    const startDate = new Date(trueUtcMs)
    const endDate = new Date(trueUtcMs + duration_minutes * 60000)

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
      return redirect(`/admin/exams/create?error=${encodeURIComponent(error.message || 'Database error')}`)
    }

    revalidatePath('/admin')
    return redirect(`/admin/exams/${exam.id}`)
  } catch (err: any) {
    if (err.message && err.message.includes('NEXT_REDIRECT')) {
      throw err; // Let Next.js handle redirect throws
    }
    console.error('Creation exception:', err)
    return redirect(`/admin/exams/create?error=${encodeURIComponent(err.message || String(err))}`)
  }
}


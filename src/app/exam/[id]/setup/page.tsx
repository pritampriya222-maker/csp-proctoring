import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import ExamSetupClient from './ExamSetupClient'

export default async function ExamSetupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Verify auth and fetch exam
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-red-500 font-medium">Please log in to continue.</p>
      </div>
    )
  }

  const { data: exam, error } = await supabase
    .from('exams')
    .select('id, title, start_time, end_time')
    .eq('id', id)
    .single()

  if (error || !exam) {
    notFound()
  }

  // Enforce timing (optional based on requirements)
  const now = new Date()
  if (now > new Date(exam.end_time)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg text-center shadow-md border max-w-sm w-full">
           <h2 className="text-xl font-bold text-red-600 mb-2">Exam Ended</h2>
           <p className="text-gray-600">This examination is no longer active.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <ExamSetupClient examId={exam.id} examTitle={exam.title} />
    </div>
  )
}

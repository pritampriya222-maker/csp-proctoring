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

  // Enforce timing
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

  // Check if they've already completed it
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('status')
    .eq('exam_id', exam.id)
    .eq('student_id', user.id)
    .single()

  if (session && (session.status === 'COMPLETED' || session.status === 'UNDER_REVIEW')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg text-center shadow-md border max-w-sm w-full">
           <h2 className="text-xl font-bold text-gray-800 mb-2">Exam Already Submitted</h2>
           <p className="text-gray-600 mb-4">You have already completed this exam.</p>
           <a href={`/student/exam/${exam.id}/result`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition">
             View Results
           </a>
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

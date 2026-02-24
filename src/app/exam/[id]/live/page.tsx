import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import LiveExamClient from './LiveExamClient'

export default async function LiveExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const { pairingId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (!exam) notFound()

  // Find or create session
  let { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', exam.id)
    .eq('student_id', user.id)
    .single()

  if (!session) {
    const { data: newSession, error } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id: exam.id,
        student_id: user.id,
        status: 'in_progress'
      })
      .select()
      .single()
      
    if (error) {
      console.error("Session creation failed", error)
      return <div className="p-8 text-red-500">Failed to initialize exam session.</div>
    }
    session = newSession
  } else if (session.status === 'completed' || session.status === 'terminated') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
           <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Session Ended</h2>
              <p className="text-gray-600">Your session for this exam has already been {session.status}.</p>
           </div>
        </div>
      )
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('id, type, question_text, options')
    .eq('exam_id', exam.id)
    .order('created_at', { ascending: true })

  // Ensure questions don't include the correct_answer field explicitly (security)
  const safeQuestions = questions?.map(q => ({
    ...q,
    // Just ensuring we don't accidentally leak correct_answer to client if it happened to be returned above
    correct_answer: undefined 
  })) || []

  return (
    <LiveExamClient 
      exam={exam} 
      questions={safeQuestions} 
      sessionId={session.id} 
      pairingId={(pairingId as string) || ''}
    />
  )
}

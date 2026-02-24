import { createClient } from '@/utils/supabase/server'
import ExamList from './ExamList'

export default async function StudentDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Find upcoming exams
  const { data: exams, error } = await supabase
    .from('exams')
    .select('*')
    .gt('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Exams from last 24h onwards
    .order('start_time', { ascending: true })

  // Find user's exam sessions
  let sessionsData: any[] = []
  if (user) {
    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('exam_id, status')
      .eq('student_id', user.id)
    if (sessions) sessionsData = sessions
  }

  // Map exams with their corresponding session status
  const examsWithStatus = exams?.map(exam => {
    const session = sessionsData.find(s => s.exam_id === exam.id)
    return {
      ...exam,
      session_status: session ? session.status.toUpperCase() : 'NOT_ATTEMPTED'
    }
  }) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold mb-6">Upcoming Exams</h2>
      
      {examsWithStatus.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <ExamList exams={examsWithStatus} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            You currently have no scheduled exams. When an admin assigns an exam to you, it will appear here.
          </p>
        </div>
      )}
    </div>
  )
}

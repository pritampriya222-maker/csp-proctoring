import { createClient } from '@/utils/supabase/server'
import ExamCard from './ExamCard'

export default async function StudentDashboard() {
  const supabase = await createClient()

  // Find upcoming exams
  const { data: exams, error } = await supabase
    .from('exams')
    .select('*')
    .gt('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Exams from last 24h onwards
    .order('start_time', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold mb-6">Upcoming Exams</h2>
      
      {exams && exams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
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

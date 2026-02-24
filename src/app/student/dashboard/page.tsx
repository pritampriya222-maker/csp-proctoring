import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

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
          {exams.map((exam) => {
            const now = new Date()
            const startTime = new Date(exam.start_time)
            const endTime = new Date(exam.end_time)
            
            // Check if exam is currently active
            const isActive = now >= startTime && now <= endTime
            const isCompleted = now > endTime

            return (
              <div key={exam.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className={`h-2 ${isActive ? 'bg-green-500' : isCompleted ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{exam.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {exam.description || 'No description provided.'}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-6">
                    <p><strong>Starts:</strong> {startTime.toLocaleString()}</p>
                    <p><strong>Duration:</strong> {exam.duration_minutes} mins</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      {isActive ? (
                        <span className="text-green-600 font-medium tracking-wide">Live Now</span>
                      ) : isCompleted ? (
                        <span className="text-gray-500">Ended</span>
                      ) : (
                        <span className="text-blue-600">Upcoming</span>
                      )}
                    </p>
                  </div>
                  
                  {isActive ? (
                    <Link
                      href={`/exam/${exam.id}/setup`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
                    >
                      Start Exam
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="block w-full text-center bg-gray-100 text-gray-400 font-medium py-2 px-4 rounded cursor-not-allowed"
                    >
                      {isCompleted ? 'Exam Ended' : 'Not Yet Time'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
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

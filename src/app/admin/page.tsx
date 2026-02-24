import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle, Clock, Users, Video } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch upcoming exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, start_time, duration_minutes')
    .order('start_time', { ascending: true })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Overview</h2>
        <Link 
          href="/admin/exams/create"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <PlusCircle size={20} />
          <span>Create New Exam</span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Scheduled Exams</p>
              <p className="text-2xl font-bold">{exams?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Video size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Live Sessions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Exams</h3>
        </div>
        {exams && exams.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {exams.map((exam) => (
              <li key={exam.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{exam.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(exam.start_time).toLocaleString()} • {exam.duration_minutes} minutes
                    </p>
                  </div>
                  <Link 
                    href={`/admin/exams/${exam.id}`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    Manage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No exams scheduled yet. Click "Create New Exam" to get started.
          </div>
        )}
      </div>
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Edit, Play, FileText } from 'lucide-react'

export default async function ExamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (!exam) {
    notFound()
  }

  // Fetch questions for this exam
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', exam.id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">{exam.title}</h2>
        </div>
          <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
            <Edit size={18} />
            <span>Edit Details</span>
          </button>
          <Link href={`/admin/exams/${exam.id}/results`} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
            <FileText size={18} />
            <span>View Results</span>
          </Link>
          <Link href={`/admin/exams/${exam.id}/monitor`} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm">
            <Play size={18} />
            <span>Live Monitor</span>
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Information</h3>
          <p className="text-gray-600 mb-6">{exam.description || 'No description provided.'}</p>
          
          <div className="flex gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              <span>{new Date(exam.start_time).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              <span>{exam.duration_minutes} minutes</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold">{questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
          <Link 
            href={`/admin/exams/${exam.id}/questions/upload`}
            className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium"
          >
            + Add Questions
          </Link>
        </div>
        
        {questions && questions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {questions.map((q, idx) => (
              <li key={q.id} className="p-6">
                 <div className="flex gap-4">
                    <span className="font-medium text-gray-500">{idx + 1}.</span>
                    <div>
                      <p className="font-medium text-gray-900">{q.question_text}</p>
                      {q.type === 'mcq' && q.options && (
                        <ul className="mt-3 space-y-2">
                          {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: string, i: number) => (
                            <li key={i} className={`text-sm px-3 py-2 rounded-md border ${
                              q.correct_answer === opt ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}>
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                 </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p>No questions have been added to this exam yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

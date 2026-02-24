import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { addQuestion } from './actions'

export default async function AddQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!exam) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/admin/exams/${exam.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-2xl font-semibold text-gray-800">Add Question to {exam.title}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form action={addQuestion} className="p-6 space-y-6">
          <input type="hidden" name="exam_id" value={exam.id} />

          <div>
            <label htmlFor="question_text" className="block text-sm font-medium text-gray-700">Question Text</label>
            <textarea
              name="question_text"
              id="question_text"
              rows={4}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="Enter your question here..."
            />
          </div>

          <div>
             <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
             <select 
               name="type" 
               id="type" 
               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
             >
                <option value="mcq">Multiple Choice Question (MCQ)</option>
                <option value="subjective">Subjective / Text Answer</option>
             </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Options (For MCQ only)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Option A</label>
                <input type="text" name="option_a" className="w-full text-sm p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Option B</label>
                <input type="text" name="option_b" className="w-full text-sm p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Option C</label>
                <input type="text" name="option_c" className="w-full text-sm p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Option D</label>
                <input type="text" name="option_d" className="w-full text-sm p-2 border rounded-md" />
              </div>
            </div>
            
            <div className="pt-2">
              <label htmlFor="correct_answer" className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
              <input 
                type="text" 
                name="correct_answer" 
                id="correct_answer" 
                className="w-full max-w-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="Exact text of the correct option (for auto-grading)"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Link 
              href={`/admin/exams/${exam.id}`} 
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={18} />
              Save Question
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

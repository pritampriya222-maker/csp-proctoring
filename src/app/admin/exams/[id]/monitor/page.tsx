import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LiveMonitorClient from './LiveMonitorClient'

export default async function LiveMonitorPage({
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

  // Fetch all active sessions for this exam
  const { data: initialSessions } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      profiles:student_id (full_name, email)
    `)
    .eq('exam_id', exam.id)
    .order('started_at', { ascending: false })

  // Fetch latest violations
  const { data: initialViolations } = await supabase
    .from('exam_violations')
    .select(`
      *,
      exam_sessions!inner(exam_id, student_id)
    `)
    .eq('exam_sessions.exam_id', exam.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/exams/${exam.id}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Live Monitor</h2>
            <p className="text-gray-500">{exam.title}</p>
          </div>
        </div>
      </div>

      <LiveMonitorClient 
        examId={exam.id} 
        initialSessions={initialSessions || []} 
        initialViolations={initialViolations || []} 
      />
    </div>
  )
}

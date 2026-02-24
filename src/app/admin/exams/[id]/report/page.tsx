import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default async function ExamReportPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ student: string }>
}) {
  const { id } = await params
  const { student } = await searchParams
  
  if (!student) return notFound()

  const supabase = await createClient()

  // Fetch Session
  const { data: session } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      exams(title, duration_minutes),
      profiles:student_id(full_name, email)
    `)
    .eq('exam_id', id)
    .eq('student_id', student)
    .single()

  if (!session) return notFound()

  // Fetch Violations
  const { data: violations } = await supabase
    .from('exam_violations')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  // Calculate Trust Score
  const baselineScore = 100
  const penalty = (violations || []).reduce((acc, v) => {
     if (v.severity === 'critical') return acc + 15
     if (v.severity === 'high') return acc + 10
     if (v.severity === 'medium') return acc + 5
     return acc + 2
  }, 0)
  
  const trustScore = Math.max(0, baselineScore - penalty)
  
  let trustStatus = { label: 'Safe', color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50 border-green-200' }
  if (trustScore < 85) {
     trustStatus = { label: 'Suspicious', color: 'text-orange-600', icon: AlertTriangle, bg: 'bg-orange-50 border-orange-200' }
  }
  if (trustScore < 60) {
     trustStatus = { label: 'High Risk', color: 'text-red-600', icon: XCircle, bg: 'bg-red-50 border-red-200' }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/exams/${id}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Proctoring Report</h2>
            <p className="text-gray-500">{session.profiles?.full_name} • {session.exams?.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Integrity Score</h3>
            <div className="flex items-end gap-4">
               <span className="text-5xl font-bold font-mono">{trustScore}%</span>
               <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${trustStatus.bg} ${trustStatus.color}`}>
                 <trustStatus.icon size={16} />
                 <span className="font-semibold text-sm">{trustStatus.label}</span>
               </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
               The integrity score decreases based on the frequency and severity of detected violations. 
               A score below 85% is flagged as suspicious.
            </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3 font-medium">
               <div className="flex justify-between">
                  <span className="text-gray-500">Critical Flags</span>
                  <span className="text-red-600 bg-red-50 px-2 rounded">{violations?.filter(v => v.severity === 'critical').length || 0}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-gray-500">High Flags</span>
                  <span className="text-orange-600 bg-orange-50 px-2 rounded">{violations?.filter(v => v.severity === 'high').length || 0}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-gray-500">Total Flags</span>
                  <span className="text-gray-900 bg-gray-100 px-2 rounded">{violations?.length || 0}</span>
               </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} />
            Violation Timeline
          </h3>
        </div>
        
        {violations && violations.length > 0 ? (
          <div className="p-6">
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
              {violations.map((v, i) => (
                <div key={v.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white 
                    ${v.severity === 'critical' ? 'bg-red-500' : v.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}
                  `}/>
                  
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900">{v.violation_type.replace('_', ' ').toUpperCase()}</span>
                    <span className="text-sm text-gray-500">{new Date(v.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
             <CheckCircle size={48} className="mx-auto text-green-200 mb-4" />
             <p>No violations recorded during this session.</p>
          </div>
        )}
      </div>

    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ShieldAlert, ArrowLeft, Clock, FileText, Activity } from 'lucide-react'

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // 2. Fetch Exam Session & Profile & Exam
  const { data: session } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      exams(title, duration_minutes),
      profiles(full_name, email)
    `)
    .eq('exam_id', id)
    .eq('student_id', user.id)
    .single()

  if (!session) {
    notFound()
  }

  // Must be completed or under review to view results
  if (session.status !== 'COMPLETED' && session.status !== 'UNDER_REVIEW') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow border max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Exam Not Finished</h2>
          <p className="text-gray-600 mb-6">You have not completed this exam yet or your session is still active.</p>
          <Link href="/student/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Calculate generic performance details
  // Note: Total Attempted might not be perfectly tracked unless we parse a JSON of answers. 
  // We'll show base score and percentage as tracked by the server action.
  
  // 3. Fetch Total Questions
  const { count: totalQuestionsCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', id)

  const totalQuestions = totalQuestionsCount || 0
  const correctCount = session.score || 0
  const wrongCount = totalQuestions - correctCount // Simplified assuming all uncorrect are wrong/unattempted

  const startedAt = new Date(session.started_at)
  const endedAt = session.ended_at ? new Date(session.ended_at) : new Date()
  const timeTakenMs = endedAt.getTime() - startedAt.getTime()
  const timeTakenMinutes = Math.floor(timeTakenMs / 60000)

  // Suspicion Level Badges
  let StatusIcon = CheckCircle
  let statusColor = "bg-green-100 text-green-800 border-green-200"
  let statusText = "Safe"
  
  if (session.suspicion_level === 'SUSPICIOUS') {
    StatusIcon = AlertTriangle
    statusColor = "bg-orange-100 text-orange-800 border-orange-200"
    statusText = "Suspicious Activity Detected"
  } else if (session.suspicion_level === 'UNDER_REVIEW') {
    StatusIcon = ShieldAlert
    statusColor = "bg-red-100 text-red-800 border-red-200"
    statusText = "Flagged for Faculty Review"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center gap-4">
          <Link href="/student/dashboard" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition drop-shadow-sm">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
        </div>

        {/* Top Section: Exam & Student Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Exam Name</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{session.exams?.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Student Name</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{session.profiles?.full_name || user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Date Attempted</p>
              <p className="text-lg font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                {startedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Total Time Taken</p>
              <p className="text-lg font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {timeTakenMinutes} / {session.exams?.duration_minutes} minutes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Score Card Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <FileText size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Performance Score</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Final Score</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{correctCount} <span className="text-xl text-gray-400 font-medium">/ {totalQuestions}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Percentage</p>
                  <p className={`text-4xl font-black mt-1 ${session.percentage >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
                     {Number(session.percentage).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg py-3">
                  <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                  <p className="text-xs text-gray-500 uppercase font-medium mt-1">Total Qs</p>
                </div>
                <div className="bg-emerald-50 rounded-lg py-3 border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-700">{correctCount}</p>
                  <p className="text-xs text-emerald-600 uppercase font-medium mt-1">Correct</p>
                </div>
                <div className="bg-red-50 rounded-lg py-3 border border-red-100">
                  <p className="text-2xl font-bold text-red-700">{wrongCount}</p>
                  <p className="text-xs text-red-600 uppercase font-medium mt-1">Incorrect</p>
                </div>
              </div>
            </div>
          </div>

          {/* Proctoring Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                <Activity size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Proctoring Summary</h2>
            </div>
            <div className="p-6 flex flex-col justify-center h-[calc(100%-73px)]">
              
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600 font-medium">Total Violations Flagged:</p>
                <div className="text-3xl font-black text-gray-900">{session.violation_count || 0}</div>
              </div>

              <div className="mb-2">
                <p className="text-gray-600 font-medium mb-3">Overall Suspicion Level:</p>
                <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${statusColor}`}>
                  <StatusIcon size={28} />
                  <span className="text-lg font-bold tracking-tight">{statusText}</span>
                </div>
              </div>

              {session.suspicion_level !== 'SAFE' && (
                <p className="text-sm text-gray-500 mt-4 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  Your exam session has been flagged due to multiple proctoring violations (e.g., looking away, background noise, or tab switching). A faculty member will manually review your session logs.
                </p>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function CalendarIcon(props: any) {
  // Simple custom Calendar icon because we didn't explicitly import it from lucide
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

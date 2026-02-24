import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminResultsClient from './AdminResultsClient'

export default async function AdminResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verify Admin Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/student/dashboard')
  }

  // 2. Fetch Exam Details
  const { data: exam, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !exam) {
    notFound()
  }

  // 3. Fetch all sessions for this exam with related profiles
  // Note: We're filtering globally for started sessions (ignoring not-attempted purely placeholder ones if they don't exist in exam_sessions)
  // Usually exam_sessions only exist if the student attempted to start.
  const { data: sessionsData } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      profiles(full_name, email)
    `)
    .eq('exam_id', id)
    .order('ended_at', { ascending: false, nullsFirst: true })

  // 4. Fetch all violations for these sessions for timeline processing
  // Optimized: fetch all violations matching the fetched session IDs
  const sessionIds = sessionsData?.map(s => s.id) || []
  let violationsData: any[] = []
  
  if (sessionIds.length > 0) {
    const { data: vls } = await supabase
      .from('exam_violations')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true })
      
    if (vls) violationsData = vls
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Results: {exam.title}</h2>
        </div>
      </div>

      <AdminResultsClient 
         exam={exam} 
         sessions={sessionsData || []} 
         violations={violationsData} 
      />
    </div>
  )
}

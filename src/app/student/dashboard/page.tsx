import { createClient } from '@/utils/supabase/server'
import ExamList from './ExamList'
import { BookOpen, CheckCircle, Clock, ShieldAlert } from 'lucide-react'

export default async function StudentDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Fetch upcoming and active exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, description, start_time, end_time, duration_minutes, is_published')
    .gt('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  // 2. Fetch user's exam sessions
  const { data: sessions } = await supabase
    .from('exam_sessions')
    .select('exam_id, status, violation_count')
    .eq('student_id', user.id)

  const sessionsData = sessions || []

  // 3. Stats Calculation
  const availableCount = exams?.length || 0
  const completedCount = sessionsData.filter(s => s.status === 'COMPLETED' || s.status === 'UNDER_REVIEW').length
  const totalViolations = sessionsData.reduce((acc, s) => acc + (s.violation_count || 0), 0)

  // Map exams with their corresponding session status
  const examsWithStatus = exams?.map(exam => {
    const session = sessionsData.find(s => s.exam_id === exam.id)
    return {
      ...exam,
      session_status: session ? session.status.toUpperCase() : 'NOT_ATTEMPTED'
    }
  }) || []

  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Available Exams" 
          value={availableCount} 
          icon={<BookOpen className="text-primary" />} 
          accent="primary"
        />
        <StatsCard 
          title="Completed" 
          value={completedCount} 
          icon={<CheckCircle className="text-success" />} 
          accent="success"
        />
        <StatsCard 
          title="Upcoming" 
          value={availableCount - (sessionsData.length)} 
          icon={<Clock className="text-blue-400" />} 
          accent="blue"
        />
        <StatsCard 
          title="Total Violations" 
          value={totalViolations} 
          icon={<ShieldAlert className={`${totalViolations > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />} 
          accent="danger"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">My Examination Schedule</h2>
        </div>
        
        {examsWithStatus.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
            <ExamList exams={examsWithStatus} />
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-lg">
            <BookOpen size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-secondary-foreground font-medium">
              You currently have no scheduled exams. When an admin assigns an exam to you, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, accent }: { title: string, value: number, icon: React.ReactNode, accent: string }) {
  const accentClasses: Record<string, string> = {
    primary: "border-primary/20 bg-primary/5",
    success: "border-success/20 bg-success/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    danger: "border-destructive/20 bg-destructive/5",
  }

  return (
    <div className={`p-6 rounded-2xl border-2 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${accentClasses[accent]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-secondary-foreground uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-black text-foreground">{value}</h3>
        </div>
        <div className="p-3 bg-card border border-border rounded-xl shadow-inner">
          {icon}
        </div>
      </div>
    </div>
  )
}

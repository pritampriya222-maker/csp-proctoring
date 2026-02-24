import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle, Clock, Users, Video, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Fetch upcoming and active exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, start_time, end_time, duration_minutes')
    .order('start_time', { ascending: true })

  // 2. Fetch Metrics
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  const { data: activeSessions } = await supabase
    .from('exam_sessions')
    .select('status, suspicion_level')

  const inProgressCount = activeSessions?.filter(s => s.status === 'IN_PROGRESS').length || 0
  const flaggedCount = activeSessions?.filter(s => s.status === 'UNDER_REVIEW' || s.suspicion_level === 'SUSPICIOUS' || s.suspicion_level === 'UNDER_REVIEW').length || 0

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Admin Control Center</h2>
          <p className="text-secondary-foreground text-sm font-medium opacity-60">System-wide monitoring & exam management</p>
        </div>
        <Link 
          href="/admin/exams/create"
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 font-bold text-sm tracking-widest uppercase"
        >
          <PlusCircle size={20} />
          <span>Create New Exam</span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Students" 
          value={totalStudents || 0} 
          icon={<Users className="text-primary" />} 
          trend="Registered"
        />
        <MetricCard 
          title="Active Exams" 
          value={exams?.filter(e => new Date(e.start_time) <= new Date() && new Date(e.end_time) >= new Date()).length || 0} 
          icon={<Clock className="text-success" />} 
          trend="Live Now"
        />
        <MetricCard 
          title="In Progress" 
          value={inProgressCount} 
          icon={<Video className="text-blue-400" />} 
          trend="Realtime"
        />
        <MetricCard 
          title="Flagged" 
          value={flaggedCount} 
          icon={<ShieldAlert className={`${flaggedCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />} 
          trend="Review Needed"
          isAlert={flaggedCount > 0}
        />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-border bg-muted/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-primary opacity-50" />
            <h3 className="text-lg font-bold text-foreground">Next Scheduled Examinations</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground opacity-50">Sort by: Date ASC</span>
        </div>
        {exams && exams.length > 0 ? (
          <div className="divide-y divide-border/50">
            {exams.map((exam) => (
              <div key={exam.id} className="px-8 py-5 hover:bg-muted/20 transition-all duration-300 group flex justify-between items-center">
                <div className="flex gap-10 items-center">
                  <div className="min-w-[200px]">
                    <h4 className="text-md font-bold text-foreground group-hover:text-primary transition-colors">{exam.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-success/50 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground opacity-40">Ready to Launch</span>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-sm text-secondary-foreground font-medium border-l border-border/50 pl-10">
                    <Clock size={16} className="text-primary opacity-40" />
                    <span>{new Date(exam.start_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-sm text-secondary-foreground font-medium border-l border-border/50 pl-10">
                    <Video size={16} className="text-primary opacity-40" />
                    <span>{exam.duration_minutes} Minutes</span>
                  </div>
                </div>
                <Link 
                  href={`/admin/exams/${exam.id}`}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-all bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg border border-primary/10 group/btn"
                >
                  Manage Session
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center">
             <BookOpen size={48} className="mx-auto text-muted-foreground mb-4 opacity-10" />
            <p className="text-secondary-foreground font-medium">No exams scheduled yet. Click "Create New Exam" to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, trend, isAlert = false }: { title: string, value: number, icon: React.ReactNode, trend: string, isAlert?: boolean }) {
  return (
    <div className={`p-6 bg-card rounded-2xl border ${isAlert ? 'border-destructive/30' : 'border-border'} shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg group relative overflow-hidden`}>
      {isAlert && <div className="absolute top-0 right-0 p-1 bg-destructive text-[8px] text-white font-black uppercase tracking-tighter rounded-bl-lg animate-pulse">Action Required</div>}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-3xl font-black text-foreground group-hover:scale-110 transition-transform origin-left">{value}</h3>
          <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${isAlert ? 'text-destructive' : 'text-primary opacity-60'}`}>{trend}</p>
        </div>
        <div className={`p-4 rounded-xl border border-border shadow-inner ${isAlert ? 'bg-destructive/5' : 'bg-muted/30 group-hover:bg-primary/5'} transition-colors`}>
          {icon}
        </div>
      </div>
      <div className={`absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
        {icon}
      </div>
    </div>
  )
}

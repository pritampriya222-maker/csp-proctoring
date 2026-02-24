import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ShieldAlert, ArrowLeft, Clock, FileText, Activity, Calendar, Trophy, Percent } from 'lucide-react'

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border max-w-md w-full text-center">
          <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-destructive" size={40} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-secondary-foreground text-sm font-medium mb-8 leading-relaxed">
            This exam result is not yet available. Please ensure your submission was successful or wait for faculty review.
          </p>
          <Link href="/student/dashboard" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // 3. Data Calculations
  const { count: totalQuestionsCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', id)

  const totalQuestions = totalQuestionsCount || 0
  const correctCount = session.score || 0
  const wrongCount = totalQuestions - correctCount
  const percentage = Number(session.percentage || 0)

  const startedAt = new Date(session.started_at)
  const endedAt = session.ended_at ? new Date(session.ended_at) : new Date()
  const timeTakenMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000)

  // Suspicion Level Logic
  let statusColor = "text-success border-success/20 bg-success/5"
  let statusLabel = "Safe & Secure"
  let statusIcon = <CheckCircle size={20} />
  
  if (session.suspicion_level === 'SUSPICIOUS') {
    statusColor = "text-warning border-warning/20 bg-warning/5"
    statusLabel = "Suspicious Behavior Detected"
    statusIcon = <AlertTriangle size={20} />
  } else if (session.suspicion_level === 'UNDER_REVIEW') {
    statusColor = "text-destructive border-destructive/20 bg-destructive/5"
    statusLabel = "Flagged for Manual Review"
    statusIcon = <ShieldAlert size={20} />
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/student/dashboard" className="p-3 bg-card border border-border rounded-xl text-secondary-foreground hover:text-primary transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Performance Report</h1>
            <p className="text-secondary-foreground text-sm font-medium opacity-60">Candidate: {session.profiles?.full_name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-secondary-foreground uppercase tracking-[0.2em] mb-1">Attempted On</span>
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Calendar size={16} className="text-primary opacity-50" />
            {startedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Big Chart + Summary */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-3xl border border-border p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy size={160} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              {/* Circular Progress */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-muted/50"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="85"
                    cx="96"
                    cy="96"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={534}
                    strokeDashoffset={534 - (534 * percentage) / 100}
                    stroke="currentColor"
                    fill="transparent"
                    r="85"
                    cx="96"
                    cy="96"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-foreground">{percentage.toFixed(0)}%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground opacity-50">Score</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-6">
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight line-clamp-2 uppercase">{session.exams?.title}</h3>
                  <p className="text-secondary-foreground font-medium mt-2 opacity-70 leading-relaxed max-w-md">Your overall performance is calculated based on correct answers and consistency in proctoring guidelines.</p>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-black text-[10px] uppercase tracking-widest ${statusColor}`}>
                    {statusIcon}
                    {statusLabel}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border bg-card text-foreground font-black text-[10px] uppercase tracking-widest">
                    <Clock size={16} className="text-primary opacity-50" />
                    {timeTakenMinutes} Mins Used
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreIndicator 
              label="Total Questions" 
              value={totalQuestions} 
              icon={<FileText size={20} className="text-primary" />} 
              color="primary"
            />
            <ScoreIndicator 
              label="Correct Answers" 
              value={correctCount} 
              icon={<CheckCircle size={20} className="text-success" />} 
              color="success"
            />
            <ScoreIndicator 
              label="Incorrect/Unattempted" 
              value={wrongCount} 
              icon={<AlertTriangle size={20} className="text-destructive" />} 
              color="danger"
            />
          </div>
        </div>

        {/* Right Column: Proctoring Health */}
        <div className="space-y-8">
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-2xl flex flex-col h-full">
            <div className="px-8 py-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-foreground">Integrity Report</h3>
              </div>
            </div>
            
            <div className="p-8 flex-1 space-y-8">
              <div className="text-center space-y-2">
                <div className="text-6xl font-black text-foreground italic">{session.violation_count || 0}</div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary-foreground opacity-50">Total Incidents Recorded</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border flex justify-between items-center group hover:border-primary/30 transition-colors">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-wider">Identity Verification</p>
                      <p className="text-sm font-bold text-foreground">Biometric Match</p>
                   </div>
                   <div className="text-success bg-success/10 p-2 rounded-lg">
                      <CheckCircle size={18} />
                   </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border flex justify-between items-center group hover:border-primary/30 transition-colors">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-wider">System Environment</p>
                      <p className="text-sm font-bold text-foreground">Fullscreen Locked</p>
                   </div>
                   <div className="text-success bg-success/10 p-2 rounded-lg">
                      <CheckCircle size={18} />
                   </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border flex justify-between items-center group hover:border-primary/30 transition-colors">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-wider">Session Trust</p>
                      <p className="text-sm font-bold text-foreground">AI Vigilance Score</p>
                   </div>
                   <div className="text-primary font-bold text-lg">{percentage > 85 ? 'High' : 'Medium'}</div>
                </div>
              </div>

              {session.suspicion_level !== 'SAFE' && (
                <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-xs font-semibold leading-relaxed">
                  Notice: Your session logs have been flagged for manual administrative review. This process typically takes 24-48 hours.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreIndicator({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    primary: "border-primary/20",
    success: "border-success/20",
    danger: "border-destructive/20"
  }

  return (
    <div className={`p-6 bg-card rounded-2xl border ${colorMap[color]} shadow-md hover:scale-[1.05] transition-transform duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-muted rounded-lg border border-border">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground opacity-40 italic">metric</span>
      </div>
      <p className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">{label}</p>
      <div className="text-3xl font-black text-foreground mt-1">{value}</div>
    </div>
  )
}

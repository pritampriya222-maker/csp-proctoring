import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Edit, Play, FileText, Layout, Activity, ShieldAlert, ChevronRight, User } from 'lucide-react'

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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link 
            href="/admin" 
            className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-secondary-foreground hover:text-primary hover:border-primary transition-all shadow-xl group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
             <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">{exam.title}</h2>
             <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-secondary-foreground text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Management Suite V2.0</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 bg-card border border-border text-secondary-foreground px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary/40 transition-all shadow-lg active:scale-95">
             <Edit size={16} className="opacity-50" />
             Edit
           </button>
           <Link 
             href={`/admin/exams/${exam.id}/results`} 
             className="flex items-center gap-2 bg-card border border-border text-success px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-success/40 transition-all shadow-lg active:scale-95"
           >
             <FileText size={16} className="opacity-50" />
             Results
           </Link>
           <Link 
             href={`/admin/exams/${exam.id}/monitor`} 
             className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
           >
             <Play size={16} />
             Live Monitor
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Info & Questions */}
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border overflow-hidden shadow-2xl">
              <div className="p-1 border-b border-border bg-muted/20 flex items-center justify-between pr-8">
                 <div className="px-8 py-4 flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                       <Layout size={18} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground">Exam Intelligence</span>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-primary opacity-50" />
                       <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{new Date(exam.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-primary opacity-50" />
                       <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{exam.duration_minutes} Mins</span>
                    </div>
                 </div>
              </div>
              <div className="p-8">
                 <p className="text-secondary-foreground text-sm font-medium leading-relaxed opacity-70">
                    {exam.description || 'No specialized instructions provided for this encryption key.'}
                 </p>
              </div>
           </div>

           <div className="bg-card/30 backdrop-blur-md rounded-3xl border border-border overflow-hidden shadow-xl">
              <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/10">
                 <div className="flex items-center gap-3">
                    <Activity size={18} className="text-primary opacity-50" />
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Encoded Questions</h3>
                 </div>
                 <Link 
                   href={`/admin/exams/${exam.id}/questions/upload`}
                   className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                 >
                   <PlusCircle size={14} /> Add Question
                 </Link>
              </div>
              
              {questions && questions.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-8 group hover:bg-muted/10 transition-colors">
                       <div className="flex gap-6">
                          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-xs font-black text-primary/40 shrink-0 group-hover:text-primary transition-colors">
                             {String(idx + 1).padStart(2, '0')}
                          </div>
                          <div className="flex-1 space-y-4">
                            <p className="font-black text-foreground leading-tight tracking-tight uppercase text-sm">{q.question_text}</p>
                            {q.type === 'mcq' && q.options && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: string, i: number) => (
                                  <div key={i} className={`text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                                    q.correct_answer === opt 
                                      ? 'bg-success/5 border-success/30 text-success' 
                                      : 'bg-background/40 border-border text-secondary-foreground opacity-60'
                                  }`}>
                                    <span>{opt}</span>
                                    {q.correct_answer === opt && <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center">
                  <ShieldAlert size={48} className="mx-auto text-secondary-foreground opacity-10 mb-4" />
                  <p className="text-secondary-foreground font-black text-[10px] uppercase tracking-widest opacity-40">No protocols defined yet.</p>
                </div>
              )}
           </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-6">
           <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden shadow-2xl group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
              <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-[0.2em] mb-4 opacity-50">Total Payload</p>
              <div className="flex items-end gap-3">
                 <h3 className="text-6xl font-black text-foreground tracking-tighter">{questions?.length || 0}</h3>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Units</span>
              </div>
           </div>

           <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden shadow-2xl group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
              <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-[0.2em] mb-4 opacity-50">Active Sessions</p>
              <div className="flex items-end gap-3">
                 <h3 className="text-6xl font-black text-foreground tracking-tighter text-blue-500">0</h3>
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Live</span>
              </div>
           </div>

           <div className="bg-card/30 border border-border/50 rounded-3xl p-8">
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <User size={14} className="text-primary" /> Admin Oversight
              </h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center text-secondary-foreground">
                       <ShieldAlert size={14} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Self-Destruct</span>
                       <span className="text-[8px] font-bold text-secondary-foreground opacity-40">Deletes after 30 days</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function PlusCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
    </svg>
  )
}

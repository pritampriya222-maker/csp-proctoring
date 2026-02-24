'use client'

import { useState } from 'react'
import { Search, Filter, Eye, AlertTriangle, ShieldAlert, CheckCircle, X, Clock, Activity, FileText, User, Mail, ChevronRight } from 'lucide-react'

type SessionWithProfile = any // From supabase join
type Violation = any

export default function AdminResultsClient({ 
  exam, 
  sessions, 
  violations 
}: { 
  exam: any, 
  sessions: SessionWithProfile[], 
  violations: Violation[] 
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'under_review'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSession, setSelectedSession] = useState<SessionWithProfile | null>(null)

  // Filter sessions based on tab and search
  const filteredSessions = sessions.filter(s => {
    // Tab filter
    if (activeTab === 'completed' && s.status !== 'COMPLETED') return false
    if (activeTab === 'under_review' && s.status !== 'UNDER_REVIEW') return false
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const nameMatch = s.profiles?.full_name?.toLowerCase().includes(q)
      const emailMatch = s.profiles?.email?.toLowerCase().includes(q)
      if (!nameMatch && !emailMatch) return false
    }
    
    return true
  })

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden relative min-h-[700px]">
      
      {/* Tab Header & Search */}
      <div className="border-b border-border px-8 pt-6 bg-muted/20 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex gap-8 -mb-px overflow-x-auto w-full md:w-auto">
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')} 
            label="All Students" 
            count={sessions.length}
          />
          <TabButton 
            active={activeTab === 'completed'} 
            onClick={() => setActiveTab('completed')} 
            label="Completed" 
            count={sessions.filter(s => s.status === 'COMPLETED').length}
            accent="success"
          />
          <TabButton 
            active={activeTab === 'under_review'} 
            onClick={() => setActiveTab('under_review')} 
            label="Under Review" 
            count={sessions.filter(s => s.status === 'UNDER_REVIEW').length}
            accent="destructive"
          />
        </div>
        
        <div className="pb-4 w-full md:w-80 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground opacity-40" size={18} />
          <input 
            type="text" 
            placeholder="Search student by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/30"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="py-5 px-8 font-black text-secondary-foreground text-[10px] uppercase tracking-[0.2em]">Student Identity</th>
              <th className="py-5 px-6 font-black text-secondary-foreground text-[10px] uppercase tracking-[0.2em] text-center">Score Metric</th>
              <th className="py-5 px-6 font-black text-secondary-foreground text-[10px] uppercase tracking-[0.2em] text-center">Incidents</th>
              <th className="py-5 px-6 font-black text-secondary-foreground text-[10px] uppercase tracking-[0.2em]">Trust Level</th>
              <th className="py-5 px-6 font-black text-secondary-foreground text-[10px] uppercase tracking-[0.2em]">Submission</th>
              <th className="py-5 px-8 font-black text-secondary-foreground text-[10px] uppercase tracking-[0.2em] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <Search size={48} />
                    <p className="font-bold uppercase tracking-widest text-xs">No matching records found</p>
                  </div>
                </td>
              </tr>
            ) : filteredSessions.map(session => (
              <tr key={session.id} className="hover:bg-muted/20 transition-all duration-300 group">
                <td className="py-5 px-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">{session.profiles?.full_name || 'Anonymous'}</div>
                      <div className="text-[11px] text-secondary-foreground font-medium opacity-50 flex items-center gap-1">
                        <Mail size={10} /> {session.profiles?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-center">
                  <div className="font-black text-lg text-foreground leading-none">{session.score || 0}</div>
                  <div className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${session.percentage >= 50 ? 'text-success' : 'text-warning'}`}>
                    {Number(session.percentage || 0).toFixed(1)}%
                  </div>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 rounded-full text-[10px] font-black border ${session.violation_count > 10 ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : session.violation_count > 3 ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/5 text-success/60 border-success/10'}`}>
                    {session.violation_count || 0}
                  </span>
                </td>
                <td className="py-5 px-6">
                  {session.suspicion_level === 'SAFE' && <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-success bg-success/10 px-3 py-1 rounded-full border border-success/20"><CheckCircle size={12}/> Safe</span>}
                  {session.suspicion_level === 'SUSPICIOUS' && <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-warning bg-warning/10 px-3 py-1 rounded-full border border-warning/20"><AlertTriangle size={12}/> Suspicious</span>}
                  {session.suspicion_level === 'UNDER_REVIEW' && <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20"><ShieldAlert size={12}/> Flagged</span>}
                  {!session.suspicion_level && <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-secondary-foreground bg-muted px-3 py-1 rounded-full border border-border">Pending</span>}
                </td>
                <td className="py-5 px-6">
                   <div className="text-[11px] font-bold text-foreground opacity-80">{formatDate(session.ended_at).split(',')[0]}</div>
                   <div className="text-[10px] text-secondary-foreground opacity-40 font-bold uppercase tracking-widest">{formatDate(session.ended_at).split(',')[1]}</div>
                </td>
                <td className="py-5 px-8 text-right">
                  <button 
                    onClick={() => setSelectedSession(session)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/10 transition-all hover:scale-[1.05]"
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Details Side Panel/Drawer */}
      {selectedSession && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-card shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-border z-[60] flex flex-col animate-in slide-in-from-right duration-300">
          
          <div className="flex-none p-8 border-b border-border flex items-start justify-between bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight uppercase">{selectedSession.profiles?.full_name || 'Anonymous Student'}</h3>
                <p className="text-sm font-medium text-secondary-foreground opacity-60">{selectedSession.profiles?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedSession(null)}
              className="p-2 text-secondary-foreground hover:text-foreground hover:bg-muted border border-border rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* Section 1: Performance */}
            <section>
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[11px] font-black text-secondary-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                   <FileText size={16} className="text-primary opacity-50" /> Academic Metric
                 </h4>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border group hover:border-primary/30 transition-colors">
                  <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest mb-1 opacity-50">Final Score</p>
                  <p className="text-3xl font-black text-foreground">{selectedSession.score || 0}</p>
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border group hover:border-primary/30 transition-colors">
                  <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest mb-1 opacity-50">Percentage</p>
                  <p className={`text-3xl font-black ${selectedSession.percentage >= 50 ? 'text-success' : 'text-warning'}`}>
                    {Number(selectedSession.percentage || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border col-span-2 flex items-center justify-between group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20"><Clock size={20} /></div>
                     <div>
                       <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-50">Session Duration</p>
                       <p className="text-lg font-black text-foreground uppercase tracking-tight">
                         {selectedSession.ended_at && selectedSession.started_at ? 
                           `${Math.floor((new Date(selectedSession.ended_at).getTime() - new Date(selectedSession.started_at).getTime()) / 60000)} Minutes` : 
                           'Unknown'
                         }
                       </p>
                     </div>
                  </div>
                  <div className="text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1 rounded-full border border-success/20">Active</div>
                </div>
              </div>
            </section>

            {/* Section 2: Proctoring */}
            <section>
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-[11px] font-black text-secondary-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                   <Activity size={16} className="text-warning opacity-50" /> Security Intelligence
                 </h4>
              </div>
              
              <div className="flex justify-between items-center bg-warning/5 p-6 rounded-2xl border border-warning/20 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-1">Violation Count</p>
                  <p className="text-4xl font-black text-foreground">{selectedSession.violation_count || 0}</p>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-1">AI Trust Level</p>
                  <p className="text-xl font-black text-foreground uppercase italic">{selectedSession.suspicion_level?.replace('_', ' ')}</p>
                </div>
                <Activity size={100} className="absolute -right-6 -bottom-6 text-warning opacity-[0.03]" />
              </div>

              <div>
                <h5 className="text-[10px] font-black text-secondary-foreground uppercase tracking-[0.2em] mb-4 opacity-40">Live Incident Timeline</h5>
                <div className="space-y-4 relative border-l border-border/50 ml-2 pl-6">
                   {(() => {
                     const stuViolations = violations.filter(v => v.session_id === selectedSession.id)
                     if (stuViolations.length === 0) {
                       return (
                         <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/10">
                            <CheckCircle size={16} className="text-success" />
                            <p className="text-xs font-bold text-success uppercase tracking-wider">No integrity incidents detected.</p>
                         </div>
                       )
                     }
                     
                     return stuViolations.map((v: any) => (
                       <div key={v.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-warning border-2 border-card group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-warning tracking-[0.15em] uppercase">
                              T-Minus {new Date(v.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-sm font-black text-foreground uppercase tracking-tight mt-0.5">{v.violation_type.replace('_', ' ')}</span>
                            {v.description && <span className="text-xs text-secondary-foreground font-medium mt-1 leading-relaxed opacity-60 italic">"{v.description}"</span>}
                          </div>
                       </div>
                     ))
                   })()}
                </div>
              </div>

            </section>

          </div>
        </div>
      )}

      {/* Overlay for clicking outside to close panel */}
      {selectedSession && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}

function TabButton({ active, onClick, label, count, accent = 'primary' }: { active: boolean, onClick: () => void, label: string, count: number, accent?: 'primary' | 'success' | 'destructive' }) {
  const accentMap = {
    primary: active ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground',
    success: active ? 'border-success text-success' : 'border-transparent text-secondary-foreground',
    destructive: active ? 'border-destructive text-destructive' : 'border-transparent text-secondary-foreground'
  }

  return (
    <button 
      onClick={onClick}
      className={`pb-4 px-2 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${accentMap[accent]} ${!active && 'opacity-50 hover:opacity-100 hover:text-foreground'}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${active ? (accent === 'success' ? 'bg-success/10' : accent === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10') : 'bg-muted'}`}>
        {count}
      </span>
    </button>
  )
}

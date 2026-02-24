'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock, VideoOff, Users, MonitorSmartphone, MonitorPlay, XCircle, ShieldAlert, User, Mail, Send, Activity } from 'lucide-react'
import AdminScreenMonitor from './AdminScreenMonitor'

type Session = any 
type Violation = any

export default function LiveMonitorClient({
  examId,
  initialSessions,
  initialViolations
}: {
  examId: string
  initialSessions: Session[]
  initialViolations: Violation[]
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [violations, setViolations] = useState<Violation[]>(initialViolations)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string>('')
  
  const supabase = createClient()

  useEffect(() => {
    const sessionSub = supabase
      .channel('public:exam_sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_sessions', filter: `exam_id=eq.${examId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            supabase.from('profiles').select('full_name, email').eq('id', payload.new.student_id).single()
              .then(({ data }) => {
                setSessions(prev => [{ ...payload.new, profiles: data }, ...prev])
              })
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s))
          }
        }
      )
      .subscribe()

    const violationSub = supabase
      .channel('public:exam_violations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'exam_violations' },
        (payload) => {
          setSessions(currentSessions => {
             const session = currentSessions.find(s => s.id === payload.new.session_id)
             if (session) {
                setViolations(prev => [payload.new, ...prev])
             }
             return currentSessions
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionSub)
      supabase.removeChannel(violationSub)
    }
  }, [examId, supabase])

  const sendCommandToStudent = async (sessionId: string, command: 'WARNING' | 'TERMINATE', message?: string) => {
    const channel = supabase.channel(`host-${sessionId}`)
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const payload = { command, message }
        await channel.send({
          type: 'broadcast',
          event: 'admin-command',
          payload: payload
        })
        setWarningMessage('')
        supabase.removeChannel(channel)
      }
    })
  }

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'face_missing': return <VideoOff className="text-destructive" size={14} />
      case 'multiple_faces': return <Users className="text-destructive" size={14} />
      case 'tab_switch': return <MonitorSmartphone className="text-warning" size={14} />
      case 'fullscreen_exit': return <MonitorSmartphone className="text-warning" size={14} />
      default: return <ShieldAlert className="text-secondary-foreground opacity-50" size={14} />
    }
  }

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'critical': return 'border-destructive/30 bg-destructive/5 text-destructive'
      case 'high': return 'border-warning/30 bg-warning/5 text-warning'
      case 'medium': return 'border-primary/30 bg-primary/5 text-primary'
      default: return 'border-border bg-muted/20 text-secondary-foreground'
    }
  }

  return (
    <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8 overflow-hidden h-full">
      
      {/* Left Area: Active Students Grid */}
      <div className="xl:col-span-3 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                 <Users size={20} className="text-primary" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Live Candidate Roster</h3>
                 <p className="text-secondary-foreground text-[10px] font-black opacity-50 uppercase tracking-widest">{sessions.length} Sessions Active</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
          {sessions.map(session => {
            const studentViolations = violations.filter(v => v.session_id === session.id)
            const isOnline = session.status === 'in_progress'
            
            return (
              <div key={session.id} className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl overflow-hidden hover:border-primary/30 transition-all flex flex-col group shadow-xl">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-secondary-foreground">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-foreground leading-tight tracking-tight uppercase text-sm">{session.profiles?.full_name || 'Anonymous'}</h4>
                        <div className="flex items-center gap-1.5 opacity-50 mt-1">
                           <Mail size={10} />
                           <p className="text-[10px] font-bold tracking-tight">{session.profiles?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      isOnline ? 'bg-success/5 border-success/30 text-success' : 'bg-muted border-border text-secondary-foreground'
                    }`}>
                      {session.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
                    <div className="flex flex-col gap-1">
                       <span className="text-[9px] font-black text-secondary-foreground uppercase tracking-widest opacity-40">Security Flags</span>
                       <div className="flex items-center gap-1.5 text-destructive font-black text-sm">
                          <ShieldAlert size={14} className="opacity-50" />
                          <span>{studentViolations.length}</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[9px] font-black text-secondary-foreground uppercase tracking-widest opacity-40">Inception</span>
                       <div className="flex items-center gap-1.5 text-foreground font-black text-sm opacity-80">
                          <Clock size={14} className="opacity-40" />
                          <span>{new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>
                  </div>
                </div>
                
                {isOnline && (
                  <div className="px-6 pb-6 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                       <button 
                         onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                         className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl transition-all border ${
                           expandedSessionId === session.id 
                             ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                             : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                         }`}
                       >
                         {expandedSessionId === session.id ? (
                            <><XCircle size={14} /> Close Surveillance</>
                         ) : (
                            <><MonitorPlay size={14} /> Expand Live Feed</>
                         )}
                       </button>
                    </div>

                    {expandedSessionId === session.id && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                         {/* Control Bar */}
                         <div className="flex flex-col gap-3 bg-background/50 p-4 rounded-2xl border border-border">
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                placeholder="Issue explicit warning..." 
                                value={warningMessage}
                                onChange={(e) => setWarningMessage(e.target.value)}
                                className="flex-1 text-xs px-4 py-2 bg-background border border-border rounded-xl text-foreground focus:border-warning/50 outline-none placeholder:opacity-20 font-medium"
                              />
                              <button 
                                onClick={() => sendCommandToStudent(session.id, 'WARNING', warningMessage || 'Security protocol violation detected.')}
                                className="p-2 bg-warning/20 text-warning border border-warning/30 rounded-xl hover:bg-warning/30 transition-all"
                                title="Send Warning"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                            <button 
                              onClick={() => {
                                if(window.confirm(`TERMINATION PROTOCOL: Expel ${session.profiles?.full_name} from the exam?`)) {
                                   sendCommandToStudent(session.id, 'TERMINATE', 'Expelled by administrator for integrity violations.')
                                }
                              }}
                              className="text-[9px] font-black uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-white p-2 rounded-xl transition-all"
                            >
                               Abort Session
                            </button>
                         </div>

                         {/* Actual Video Components */}
                         <div className="rounded-2xl overflow-hidden border border-border bg-black shadow-2xl">
                            <AdminScreenMonitor 
                               sessionId={session.id} 
                               studentName={session.profiles?.full_name || 'Candidate'} 
                            />
                         </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          
          {sessions.length === 0 && (
            <div className="col-span-full bg-card/30 border border-border border-dashed rounded-3xl py-24 text-center">
              <Users size={64} className="mx-auto text-secondary-foreground opacity-10 mb-6" />
              <p className="text-secondary-foreground font-black uppercase tracking-widest text-xs opacity-50">No candidates detected in the encryption room.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Security Stream */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
           <div className="bg-destructive/20 p-2 rounded-lg">
              <Activity size={20} className="text-destructive animate-pulse" />
           </div>
           <div>
              <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Integrity Stream</h3>
              <p className="text-secondary-foreground text-[10px] font-black opacity-50 uppercase tracking-widest">Global Flag Timeline</p>
           </div>
        </div>

        <div className="flex-1 bg-card/30 backdrop-blur-xl border border-border rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {violations.map(violation => {
              const student = sessions.find(s => s.id === violation.session_id)
              return (
                <div key={violation.id} className={`p-4 rounded-2xl border text-xs animate-in slide-in-from-right duration-300 ${getSeverityStyles(violation.severity)}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black uppercase tracking-tight">{student?.profiles?.full_name || 'System Identity'}</span>
                    <span className="text-[9px] font-bold opacity-60">{new Date(violation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-start gap-3 mt-3">
                    <div className="mt-0.5 opacity-60">
                       {getViolationIcon(violation.violation_type)}
                    </div>
                    <p className="font-bold leading-relaxed">{violation.description}</p>
                  </div>
                </div>
              )
            })}
            
            {violations.length === 0 && (
              <div className="text-center py-20">
                <CheckCircle size={48} className="mx-auto text-success opacity-10 mb-4" />
                <p className="text-secondary-foreground font-black uppercase tracking-widest text-[10px] opacity-40">System Integrity Nominal</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

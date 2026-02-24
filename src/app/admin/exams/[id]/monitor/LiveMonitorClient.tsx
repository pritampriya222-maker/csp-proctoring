'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock, VideoOff, EyeOff, Users, MonitorSmartphone, FileText } from 'lucide-react'

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
  const supabase = createClient()

  useEffect(() => {
    // 1. Subscribe to new sessions (students starting exam)
    const sessionSub = supabase
      .channel('public:exam_sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_sessions', filter: `exam_id=eq.${examId}` },
        (payload) => {
          // If insert, fetch the full profile to get the name
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

    // 2. Subscribe to new violations
    const violationSub = supabase
      .channel('public:exam_violations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'exam_violations' },
        (payload) => {
          // We need to check if this violation belongs to this exam
          // This requires finding if the session_id is in our active sessions
          setSessions(currentSessions => {
             const session = currentSessions.find(s => s.id === payload.new.session_id)
             if (session) {
                // It belongs to this exam! Add it to the log
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

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'face_missing': return <VideoOff className="text-red-500 min-w-4 min-h-4" size={16} />
      case 'multiple_faces': return <Users className="text-red-500 min-w-4 min-h-4" size={16} />
      case 'tab_switch': return <MonitorSmartphone className="text-orange-500 min-w-4 min-h-4" size={16} />
      case 'fullscreen_exit': return <MonitorSmartphone className="text-orange-500 min-w-4 min-h-4" size={16} />
      default: return <AlertCircle className="text-gray-500 min-w-4 min-h-4" size={16} />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
      
      {/* Left Panel: Active Students */}
      <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Live Students ({sessions.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map(session => {
              const studentViolations = violations.filter(v => v.session_id === session.id)
              const statusColor = session.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
              
              return (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{session.profiles?.full_name || 'Unknown Student'}</h4>
                      <p className="text-xs text-gray-500">{session.profiles?.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-red-600 font-medium">
                      <AlertCircle size={14} />
                      <span>{studentViolations.length} Flags</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={14} />
                      <span>{new Date(session.started_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {session.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <Link 
                        href={`/admin/exams/${examId}/report?student=${session.student_id}`}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        <FileText size={14} />
                        View Report
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
            
            {sessions.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No students have started the exam yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Live Violation Stream */}
      <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h3 className="font-semibold text-gray-800">Violation Stream</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {violations.map(violation => {
            const student = sessions.find(s => s.id === violation.session_id)
            return (
              <div key={violation.id} className={`p-3 rounded-md border text-sm ${getSeverityColor(violation.severity)}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold">{student?.profiles?.full_name || 'Unknown'}</span>
                  <span className="text-xs opacity-75">{new Date(violation.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  {getViolationIcon(violation.violation_type)}
                  <p>{violation.description}</p>
                </div>
              </div>
            )
          })}
          
          {violations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={32} className="mx-auto text-green-300 mb-3" />
              <p>No violations detected yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

'use client'

import { useState } from 'react'
import { Search, Filter, Eye, AlertTriangle, ShieldAlert, CheckCircle, X, Clock, Activity, FileText } from 'lucide-react'

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative min-h-[600px]">
      
      {/* Tab Header & Search */}
      <div className="border-b border-gray-200 px-6 pt-4 bg-gray-50/50 flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex gap-6 -mb-px overflow-x-auto w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            All Students
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'completed' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setActiveTab('under_review')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'under_review' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Under Review
          </button>
        </div>
        
        <div className="pb-3 w-full md:w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-[8px] text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search student..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Student Name</th>
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Exam Name</th>
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Score</th>
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Violations</th>
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Suspicion Level</th>
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">Submitted At</th>
              <th className="py-3 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : filteredSessions.map(session => (
              <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-6">
                  <div className="font-medium text-gray-900">{session.profiles?.full_name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{session.profiles?.email}</div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-700">{exam.title}</td>
                <td className="py-3 px-6 text-center">
                  <div className="font-bold text-gray-900">{session.score || 0}</div>
                  <div className={`text-xs font-medium ${session.percentage >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
                    {Number(session.percentage || 0).toFixed(1)}%
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-full text-xs font-medium ${session.violation_count > 12 ? 'bg-red-100 text-red-800' : session.violation_count > 5 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                    {session.violation_count || 0}
                  </span>
                </td>
                <td className="py-3 px-6">
                  {session.suspicion_level === 'SAFE' && <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100"><CheckCircle size={12}/> Safe</span>}
                  {session.suspicion_level === 'SUSPICIOUS' && <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-100"><AlertTriangle size={12}/> Suspicious</span>}
                  {session.suspicion_level === 'UNDER_REVIEW' && <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-100"><ShieldAlert size={12}/> Under Review</span>}
                  {!session.suspicion_level && <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Unknown</span>}
                </td>
                <td className="py-3 px-6 text-sm text-gray-600">{formatDate(session.ended_at)}</td>
                <td className="py-3 px-6 text-right">
                  <button 
                    onClick={() => setSelectedSession(session)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={14} /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Details Side Panel/Drawer */}
      {selectedSession && (
        <div className="absolute inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-gray-200 z-10 flex flex-col animate-in slide-in-from-right duration-200">
          
          <div className="flex-none p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedSession.profiles?.full_name || 'Unknown Student'}</h3>
              <p className="text-sm text-gray-500">{selectedSession.profiles?.email}</p>
            </div>
            <button 
              onClick={() => setSelectedSession(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section 1: Performance */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <FileText size={16} className="text-blue-500" /> Performance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Final Score</p>
                  <p className="text-2xl font-black text-gray-900">{selectedSession.score || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Percentage</p>
                  <p className={`text-2xl font-black ${selectedSession.percentage >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
                    {Number(selectedSession.percentage || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 col-span-2 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-md"><Clock size={16} /></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Time Taken</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedSession.ended_at && selectedSession.started_at ? 
                        `${Math.floor((new Date(selectedSession.ended_at).getTime() - new Date(selectedSession.started_at).getTime()) / 60000)} minutes` : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Proctoring */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Activity size={16} className="text-orange-500" /> Proctoring Log
              </h4>
              
              <div className="flex justify-between items-center bg-orange-50 p-4 rounded-lg border border-orange-100 mb-6">
                <div>
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1">Total Violations</p>
                  <p className="text-2xl font-black text-orange-900">{selectedSession.violation_count || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1">Suspicion Level</p>
                  <p className="text-lg font-bold text-orange-900 capitalize">{selectedSession.suspicion_level?.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">Event Timeline</h5>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                   {/* Get timeline events for this specific student */}
                   {(() => {
                     const stuViolations = violations.filter(v => v.session_id === selectedSession.id)
                     if (stuViolations.length === 0) {
                       return <div className="text-sm text-gray-500 italic relative z-10 bg-white py-2">No violations recorded. Student maintained safe proctoring.</div>
                     }
                     
                     return stuViolations.map((v, i) => (
                       <div key={v.id} className="relative z-10 pl-6 pb-4 group last:pb-0">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1 w-[8px] h-[8px] rounded-full bg-orange-400 shadow-[0_0_0_4px_white] mt-1 ml-[7px]"></div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-orange-600 tracking-wide">
                              {new Date(v.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-sm text-gray-800 font-medium mt-0.5">{v.violation_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                            {v.description && <span className="text-xs text-gray-500 mt-1">{v.description}</span>}
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
          className="absolute inset-0 z-0 bg-transparent xl:bg-gray-900/10 transition-colors"
          onClick={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}

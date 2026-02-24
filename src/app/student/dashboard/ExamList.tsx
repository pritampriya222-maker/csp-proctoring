'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Calendar, CheckCircle, AlertCircle, PlayCircle, Loader2, ArrowRight } from 'lucide-react'

export default function ExamList({ exams }: { exams: any[] }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!now) {
    return (
      <div className="p-20 flex flex-col justify-center items-center text-secondary-foreground space-y-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-medium tracking-widest uppercase opacity-50">Synchronizing Session...</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="py-5 px-8 font-bold text-secondary-foreground text-[11px] uppercase tracking-[0.2em] w-1/3">Main Examination</th>
            <th className="py-5 px-6 font-bold text-secondary-foreground text-[11px] uppercase tracking-[0.2em]">Scheduled Date</th>
            <th className="py-5 px-6 font-bold text-secondary-foreground text-[11px] uppercase tracking-[0.2em]">Duration</th>
            <th className="py-5 px-6 font-bold text-secondary-foreground text-[11px] uppercase tracking-[0.2em]">Current Status</th>
            <th className="py-5 px-8 font-bold text-secondary-foreground text-[11px] uppercase tracking-[0.2em] text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {exams.map((exam) => {
            const startTime = new Date(exam.start_time)
            const endTime = new Date(exam.end_time)
            const status = exam.session_status // NOT_ATTEMPTED, IN_PROGRESS, COMPLETED, UNDER_REVIEW
            
            const isLiveTime = now >= startTime && now <= endTime
            const isFuture = now < startTime
            const isPast = now > endTime

            // Determine badge appearance
            let statusBadge = null
            if (status === 'COMPLETED') {
              statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-success/10 text-success border border-success/20"><CheckCircle size={12}/> Completed</span>
            } else if (status === 'UNDER_REVIEW') {
              statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20"><AlertCircle size={12}/> Under Review</span>
            } else if (status === 'IN_PROGRESS') {
              statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 animate-pulse"><PlayCircle size={12}/> In Progress</span>
            } else {
              // NOT_ATTEMPTED
              if (isLiveTime) {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">Live Now</span>
              } else if (isPast) {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-secondary-foreground border border-border">Missed</span>
              } else {
                statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted/50 text-secondary-foreground border border-border">Upcoming</span>
              }
            }

            // Determine Action Button
            let actionBtn = null
            if (status === 'COMPLETED') {
               actionBtn = <button disabled className="w-full py-2.5 px-4 bg-muted text-muted-foreground rounded-full text-xs cursor-not-allowed font-bold uppercase tracking-widest opacity-50 underline-offset-4 decoration-2 decoration-primary">Submitted</button>
            } else if (status === 'UNDER_REVIEW') {
               actionBtn = <button disabled className="w-full py-2.5 px-4 bg-destructive/5 text-destructive/40 border border-destructive/10 rounded-full text-xs cursor-not-allowed font-bold uppercase tracking-widest">Locked</button>
            } else if (status === 'IN_PROGRESS') {
               if (isPast) {
                 actionBtn = <button disabled className="w-full py-2.5 px-4 bg-muted text-muted-foreground rounded-full text-xs cursor-not-allowed font-bold uppercase tracking-widest">Expired</button>
               } else {
                 actionBtn = <Link href={`/exam/${exam.id}/setup`} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-[1.02]">Resume <ArrowRight size={14} /></Link>
               }
            } else {
               // NOT_ATTEMPTED
               if (isFuture) {
                 actionBtn = <button disabled className="w-full py-2.5 px-4 bg-muted text-muted-foreground rounded-full text-xs cursor-not-allowed font-bold uppercase tracking-widest">Not Started</button>
               } else if (isPast) {
                 actionBtn = <button disabled className="w-full py-2.5 px-4 bg-muted text-muted-foreground rounded-full text-xs cursor-not-allowed font-bold uppercase tracking-widest">Closed</button>
               } else {
                 actionBtn = <Link href={`/exam/${exam.id}/setup`} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-[1.02]">Start Exam <ArrowRight size={14} /></Link>
               }
            }

            return (
              <tr key={exam.id} className="hover:bg-muted/30 transition-all duration-300 group">
                <td className="py-6 px-8">
                  <div className="font-bold text-foreground group-hover:text-primary transition-colors">{exam.title}</div>
                  {exam.description && <div className="text-xs text-secondary-foreground mt-1 line-clamp-1 font-medium opacity-60">{exam.description}</div>}
                </td>
                <td className="py-6 px-6 text-[13px] text-foreground font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary opacity-50" />
                    {startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-secondary-foreground mt-1 ml-5 font-bold opacity-40">
                    {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-6 px-6 text-[13px] text-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-primary opacity-50" />
                    {exam.duration_minutes} Mins
                  </div>
                </td>
                <td className="py-6 px-6">
                  {statusBadge}
                </td>
                <td className="py-6 px-8 align-middle">
                  <div className="w-full max-w-[140px] mx-auto">
                    {actionBtn}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

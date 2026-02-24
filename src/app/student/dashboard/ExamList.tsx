'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Calendar, CheckCircle, AlertCircle, PlayCircle, Loader2 } from 'lucide-react'

export default function ExamList({ exams }: { exams: any[] }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!now) {
    return (
      <div className="p-8 flex justify-center items-center text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading exams...
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-4 px-6 font-semibold text-gray-700 text-sm w-1/3">Exam Name</th>
            <th className="py-4 px-6 font-semibold text-gray-700 text-sm">Date</th>
            <th className="py-4 px-6 font-semibold text-gray-700 text-sm">Duration</th>
            <th className="py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
            <th className="py-4 px-6 font-semibold text-gray-700 text-sm text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
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
              statusBadge = <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12}/> Completed</span>
            } else if (status === 'UNDER_REVIEW') {
              statusBadge = <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertCircle size={12}/> Under Review</span>
            } else if (status === 'IN_PROGRESS') {
              statusBadge = <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><PlayCircle size={12}/> In Progress</span>
            } else {
              // NOT_ATTEMPTED
              if (isLiveTime) {
                statusBadge = <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 animate-pulse">Live Now</span>
              } else if (isPast) {
                statusBadge = <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Missed</span>
              } else {
                statusBadge = <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Not Attempted</span>
              }
            }

            // Determine Action Button
            let actionBtn = null
            if (status === 'COMPLETED') {
               actionBtn = <button disabled className="w-full py-1.5 px-3 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed font-medium">Completed</button>
            } else if (status === 'UNDER_REVIEW') {
               actionBtn = <button disabled className="w-full py-1.5 px-3 bg-orange-50 text-orange-400 border border-orange-100 rounded-md text-sm cursor-not-allowed font-medium">Awaiting Faculty Review</button>
            } else if (status === 'IN_PROGRESS') {
               if (isPast) {
                 actionBtn = <button disabled className="w-full py-1.5 px-3 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed font-medium">Time Expired</button>
               } else {
                 actionBtn = <Link href={`/exam/${exam.id}/setup`} className="block w-full text-center py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition">Resume Exam</Link>
               }
            } else {
               // NOT_ATTEMPTED
               if (isFuture) {
                 actionBtn = <button disabled className="w-full py-1.5 px-3 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed font-medium">Not Yet Time</button>
               } else if (isPast) {
                 actionBtn = <button disabled className="w-full py-1.5 px-3 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed font-medium">Exam Ended</button>
               } else {
                 actionBtn = <Link href={`/exam/${exam.id}/setup`} className="block w-full text-center py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition shadow-sm">Start Exam</Link>
               }
            }

            return (
              <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{exam.title}</div>
                  {exam.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{exam.description}</div>}
                </td>
                <td className="py-4 px-6 border-b border-gray-100 text-sm text-gray-600 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 ml-5">
                    {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-4 px-6 border-b border-gray-100 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    {exam.duration_minutes} mins
                  </div>
                </td>
                <td className="py-4 px-6 border-b border-gray-100">
                  {statusBadge}
                </td>
                <td className="py-4 px-6 border-b border-gray-100 align-middle">
                  <div className="w-full max-w-[160px] mx-auto">
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

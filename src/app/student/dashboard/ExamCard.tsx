'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ExamCard({ exam }: { exam: any }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // Update 'now' every second so the card dynamically unlocks
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const startTime = new Date(exam.start_time)
  const endTime = new Date(exam.end_time)
  
  // Check if exam is currently active (using Browser's local time)
  const isActive = now >= startTime && now <= endTime
  const isCompleted = now > endTime

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className={`h-2 ${isActive ? 'bg-green-500' : isCompleted ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{exam.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {exam.description || 'No description provided.'}
        </p>
        
        <div className="space-y-2 text-sm text-gray-500 mb-6">
          <p><strong>Starts:</strong> {startTime.toLocaleString()}</p>
          <p><strong>Duration:</strong> {exam.duration_minutes} mins</p>
          <p>
            <strong>Status:</strong>{' '}
            {isActive ? (
              <span className="text-green-600 font-medium tracking-wide animate-pulse">Live Now</span>
            ) : isCompleted ? (
              <span className="text-gray-500">Ended</span>
            ) : (
              <span className="text-blue-600">Upcoming ({Math.max(0, Math.floor((startTime.getTime() - now.getTime()) / 60000))} mins left)</span>
            )}
          </p>
        </div>
        
        {isActive ? (
          <Link
            href={`/exam/${exam.id}/setup`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
          >
            Start Exam
          </Link>
        ) : (
          <button
            disabled
            className="block w-full text-center bg-gray-100 text-gray-400 font-medium py-2 px-4 rounded cursor-not-allowed"
          >
            {isCompleted ? 'Exam Ended' : 'Not Yet Time'}
          </button>
        )}
      </div>
    </div>
  )
}

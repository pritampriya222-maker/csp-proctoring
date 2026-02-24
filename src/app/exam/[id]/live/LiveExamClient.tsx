'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, Video, Mic, Monitor, Smartphone, CheckCircle } from 'lucide-react'
import { LiveKitRoom, useTracks, VideoTrack } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import { createClient } from '@/utils/supabase/client'
import { submitExam, recordViolation } from './actions'
import ProctoringEngine from './ProctoringEngine'

// Define the exam interface
export default function LiveExamClient({
  exam,
  questions,
  sessionId,
  pairingId,
}: {
  exam: any
  questions: any[]
  sessionId: string
  pairingId?: string
}) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Proctoring Statuses
  const [phoneStatus, setPhoneStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [mobileStream, setMobileStream] = useState<MediaStream | null>(null)
  const [sysStatus, setSysStatus] = useState({
    camera: 'success',
    mic: 'success',
    screen: 'success'
  })

  const addWarning = useCallback((msg: string) => {
    setWarnings((prev) => [...prev, msg])
    
    // Update system statuses based on warnings
    if (msg.toLowerCase().includes('face') || msg.toLowerCase().includes('camera')) {
       setSysStatus(s => ({ ...s, camera: 'error' }))
    } else if (msg.toLowerCase().includes('speak') || msg.toLowerCase().includes('mic')) {
       setSysStatus(s => ({ ...s, mic: 'error' }))
    } else if (msg.toLowerCase().includes('screen') || msg.toLowerCase().includes('tab') || msg.toLowerCase().includes('fullscreen')) {
       setSysStatus(s => ({ ...s, screen: 'error' }))
    }

    // Auto-clear warning from view after 5s and reset status to success if they fix it
    setTimeout(() => {
      setWarnings((prev) => prev.filter((w) => w !== msg))
      setSysStatus({ camera: 'success', mic: 'success', screen: 'success' })
    }, 5000)
  }, [])

  // Format time remaining
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Auto-Submit function (declared early so effects can use it safely)
  const autoSubmit = useCallback(async () => {
    try {
      // 1. Mark session as completed in DB via API
      await submitExam(sessionId, answers)
      
      // Exit fullscreen before redirecting to avoid browser warnings
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch (err) {
          console.warn("Could not exit fullscreen gracefully:", err)
        }
      }
      
      // Stop proctoring right now by hiding the component
      setIsSubmitting(true)
      
      // Give React a tiny tick to unmount the engine and run its cleanup, then navigate
      setTimeout(() => {
        router.push('/student/dashboard?message=Exam+submitted+successfully')
      }, 500)
    } catch (e) {
      console.error("Submission error", e)
      alert("Failed to submit exam. Please try again or contact invigilator.")
    }
  }, [sessionId, answers, router])

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      autoSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, autoSubmit])

  // Security Measures: Fullscreen enforcement
  const enforceFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (err) {
      // Browsers will reject requestFullscreen if not triggered by a user click (e.g. on mount).
      // We catch this silently and the user will see the "Exam Paused" screen asking them to click to enter.
      console.warn('Fullscreen automatic request was blocked by browser. Waiting for user interaction.')
      addWarning('Fullscreen is required for this exam.')
    }
  }, [addWarning])

  // Security: Detect Tab Switch/Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning('Tab switch detected! Return to the exam immediately.')
        recordViolation(sessionId, 'tab_switch', 'Student switched away from the exam tab', 'critical')
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        addWarning('Fullscreen exited! Please return to fullscreen to continue.')
        recordViolation(sessionId, 'fullscreen_exit', 'Student exited fullscreen mode', 'medium')
      } else {
        setIsFullscreen(true)
      }
    }
    
    // Prevent right click
    const handleContext = (e: MouseEvent) => {
      e.preventDefault()
    }
    
    // Prevent copy-paste shortcut
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'x', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContext)
    window.addEventListener('keydown', handleKeydown)

    // Enforce on mount
    enforceFullscreen()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', handleContext)
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [enforceFullscreen, addWarning, sessionId])

  // Security: Listen for direct Admin Commands via Realtime Broadcast
  useEffect(() => {
    const supabase = createClient()
    const adminChannel = supabase.channel(`host-${sessionId}`)
      .on('broadcast', { event: 'admin-command' }, (payload) => {
         const { command, message } = payload.payload
         
         if (command === 'WARNING') {
            addWarning(`ADMIN INSTRUCTION: ${message}`)
            recordViolation(sessionId, 'admin_warning', `Admin issued explicit text warning: ${message}`, 'high')
         } else if (command === 'TERMINATE') {
            alert(`EXAM TERMINATED BY ADMIN: ${message}`)
            autoSubmit() // Instantly end exam gracefully
         }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(adminChannel)
    }
  }, [sessionId, addWarning, autoSubmit])

  const handleProctoringWarning = useCallback((msg: string) => {
    addWarning(msg)
    
    // Determine severity and type from the engine message
    let type = 'ai_warning'
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'

    if (msg.includes('Face not detected')) { type = 'face_missing'; severity = 'high' }
    if (msg.includes('Multiple faces')) { type = 'multiple_faces'; severity = 'critical' }
    if (msg.includes('Speaking')) { type = 'speaking'; severity = 'high' }
    if (msg.includes('Screen sharing stopped')) { type = 'screen_stop'; severity = 'critical' }
    if (msg.includes('Mobile Phone')) { type = 'phone_disconnected'; severity = 'high' }

    recordViolation(sessionId, type, msg, severity)
  }, [addWarning, sessionId])

  // Mobile pairing reconnection
  useEffect(() => {
    if (!pairingId) return
    let peerInstance: any = null

    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer(pairingId)
      peerInstance = peer
      peer.on('open', () => {
        console.log('LiveExam Peer open with ID:', pairingId)
      })

      // Accept data connections so the mobile client's `dataConn.on('open')` triggers
      peer.on('connection', (conn: any) => {
        conn.on('data', () => {}) // just acknowledge
      })

      peer.on('call', (call: any) => {
        call.answer()
        call.on('stream', (remoteStream: MediaStream) => {
          setMobileStream(remoteStream)
          setPhoneStatus('success')
        })
        call.on('close', () => {
          setMobileStream(null)
          setPhoneStatus('error')
          handleProctoringWarning('Mobile Phone Disconnected. Return phone to exam mode immediately.')
        })
      })

      // If peer is already destroyed or ID taken, try to reconnect occasionally
      peer.on('error', (err: any) => {
         console.warn('PeerJS Error in LiveExam:', err)
      })
    })

    return () => {
      if (peerInstance) peerInstance.destroy()
    }
  }, [pairingId, handleProctoringWarning])

  const handleAnswerSelect = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }



  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <AlertTriangle size={64} className="text-yellow-500 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Exam Paused</h2>
        <p className="text-gray-300 text-center max-w-lg mb-8">
          This examination requires fullscreen mode. Leaving fullscreen is recorded as a violation.
          Please return to the exam carefully.
        </p>
        <button 
          onClick={enforceFullscreen}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition"
        >
          Return to Exam
        </button>
      </div>
    )
  }

  const question = questions[currentQuestionIdx]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none relative">
      <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 shadow-sm gap-4">
        <h1 className="text-lg font-bold text-gray-800">{exam.title}</h1>
        
        {/* Proctoring Status Panel */}
        <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-full border text-sm font-medium">
           <span className="text-gray-500 mr-2 uppercase text-xs tracking-wider">Live Status:</span>
           <div className={`flex items-center gap-1 ${sysStatus.camera === 'success' ? 'text-green-600' : 'text-red-600 animate-pulse'}`}>
              <Video size={16} />
           </div>
           <div className={`flex items-center gap-1 ${sysStatus.mic === 'success' ? 'text-green-600' : 'text-red-600 animate-pulse'}`}>
              <Mic size={16} />
           </div>
           <div className={`flex items-center gap-1 ${sysStatus.screen === 'success' ? 'text-green-600' : 'text-red-600 animate-pulse'}`}>
              <Monitor size={16} />
           </div>
           {pairingId && (
             <div className={`flex items-center gap-1 ${phoneStatus === 'success' ? 'text-green-600' : 'text-red-600 animate-pulse'}`} title={phoneStatus === 'success' ? 'Phone Connected' : 'Phone Disconnected'}>
                <Smartphone size={16} />
             </div>
           )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
            <Clock size={20} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to submit your exam early? This cannot be undone.')) {
                autoSubmit()
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-md font-medium text-sm transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Warning Toasts */}
      <div className="fixed top-20 right-6 z-50 space-y-3 pointer-events-none">
        {warnings.map((msg, i) => (
          <div key={i} className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
            <AlertTriangle size={20} />
            <span className="font-medium">{msg}</span>
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-600">Question {currentQuestionIdx + 1} of {questions.length}</h2>
          </div>
          
          <div className="p-8 flex-1">
            <h3 className="text-xl text-gray-900 font-medium mb-8 leading-relaxed">
              {question?.question_text || "Loading..."}
            </h3>

            {question?.type === 'mcq' && question.options && (
              <div className="space-y-4">
                {((typeof question.options === 'string' ? JSON.parse(question.options || '[]') : question.options) as string[]).map((opt, idx) => {
                  const isSelected = answers[question.id] === opt
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(question.id, opt)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-900 scale-[1.01]' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="inline-block w-8 font-medium text-gray-400">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
            
            {question?.type === 'subjective' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                className="w-full h-48 p-4 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:ring-0 resize-none"
                placeholder="Type your answer here..."
                onPaste={(e) => e.preventDefault()} // Security block
              />
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
             <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className="px-6 py-2 border border-gray-300 rounded-md font-medium text-gray-600 hover:bg-white disabled:opacity-50 transition"
             >
                Previous
             </button>
             
             {currentQuestionIdx < questions.length - 1 ? (
               <button
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition"
               >
                  Next
               </button>
             ) : (
               <button
                  onClick={() => {
                    if(window.confirm('You have reached the end. Submit all answers?')) {
                      autoSubmit()
                    }
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition"
               >
                  Finish
               </button>
             )}
          </div>
        </div>
      </main>
      
      {/* Background Media Engine & LiveKit Broadcaster */}
      {!isSubmitting && (
         <>
           <ProctoringEngine sessionId={sessionId} onWarning={handleProctoringWarning} />
           <LiveKitBroadcaster sessionId={sessionId} />
         </>
      )}
    </div>
  )
}

// Sub-component to handle connecting to LiveKit and publishing screen
function LiveKitBroadcaster({ sessionId }: { sessionId: string }) {
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    // Fetch token for this specific room
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${sessionId}&username=student-${sessionId}`)
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
        }
      } catch (e) {
        console.error('Failed to fetch LiveKit token', e)
      }
    }
    fetchToken()
  }, [sessionId])

  if (!token || !process.env.NEXT_PUBLIC_LIVEKIT_URL) return null

  return (
    <LiveKitRoom
      video={false} // We don't want standard webcam automatically, we want screen
      audio={false}
      screen={true} // Automatically prompt and publish screen!
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      style={{ display: 'none' }} // Hidden from student view
      onConnected={() => console.log('Connected to LiveKit as Broadcaster')}
      onDisconnected={() => console.log('Disconnected from LiveKit')}
    >
      {/* Empty internal, it automatically publishes due to screen=true */}
    </LiveKitRoom>
  )
}

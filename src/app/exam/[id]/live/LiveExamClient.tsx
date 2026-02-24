'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, Video, Mic, Monitor, Smartphone, CheckCircle, ChevronLeft, ChevronRight, FileText, ShieldCheck, Info, UserCheck, AlertOctagon } from 'lucide-react'
import { LiveKitRoom, useTracks, VideoTrack, useLocalParticipant, useConnectionState } from '@livekit/components-react'
import { RoomEvent, Track, ConnectionState } from 'livekit-client'
import { createClient } from '@/utils/supabase/client'
import { submitExam, recordViolation } from './actions'
import ProctoringEngine from './ProctoringEngine'

// Inner component to explicitly enable screensharing once connected
function AutoScreenPublisher() {
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()

  useEffect(() => {
    // Only attempt to publish if the room is fully connected
    if (connectionState === ConnectionState.Connected && localParticipant && !localParticipant.isScreenShareEnabled) {
      localParticipant.setScreenShareEnabled(true, { audio: false }).catch(err => {
        console.error('Failed to auto-publish screen share to LiveKit:', err)
      })
    }
  }, [localParticipant, connectionState])

  return null
}

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
  
  // Custom Toast System
  const [toasts, setToasts] = useState<any[]>([])
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // UI Features
  const [saveStatus, setSaveStatus] = useState<'Saving...' | 'Saved' | ''>('')
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  // Restore answers on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`exam_answers_${sessionId}`)
      if (saved) setAnswers(JSON.parse(saved))
    } catch (e) {}
  }, [sessionId])
  
  // Proctoring Statuses
  const [phoneStatus, setPhoneStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [mobileStream, setMobileStream] = useState<MediaStream | null>(null)
  const [sysStatus, setSysStatus] = useState({
    camera: 'success',
    mic: 'success',
    screen: 'success'
  })

  const addToast = useCallback((msg: string, type: 'critical' | 'warning' | 'info' = 'warning') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, msg, type }])
    
    // Update system statuses based on warnings
    if (msg.toLowerCase().includes('face') || msg.toLowerCase().includes('camera')) {
       setSysStatus(s => ({ ...s, camera: 'error' }))
    } else if (msg.toLowerCase().includes('speak') || msg.toLowerCase().includes('mic')) {
       setSysStatus(s => ({ ...s, mic: 'error' }))
    } else if (msg.toLowerCase().includes('screen') || msg.toLowerCase().includes('tab') || msg.toLowerCase().includes('fullscreen')) {
       setSysStatus(s => ({ ...s, screen: 'error' }))
    }

    // Auto-clear toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      setSysStatus({ camera: 'success', mic: 'success', screen: 'success' })
    }, 6000)
  }, [])

  // Format time remaining
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Final Submission Logic
  const submitExamFinal = useCallback(async () => {
    setIsSubmitting(true)
    setIsSubmitModalOpen(false)
    try {
      const res = await submitExam(sessionId, answers)
      
      if (document.fullscreenElement) {
        try { await document.exitFullscreen() } catch (err) {}
      }
      
      try { localStorage.removeItem(`exam_answers_${sessionId}`) } catch(e) {}
      
      setTimeout(() => {
        if (res.redirect) {
          router.push(res.redirect)
        } else {
          router.push('/student/dashboard?message=Exam+submitted+successfully')
        }
      }, 500)
    } catch (e) {
      console.error("Submission error", e)
      setIsSubmitting(false)
    }
  }, [sessionId, answers, router])

  const autoSubmit = useCallback(async () => {
     await submitExamFinal()
  }, [submitExamFinal])

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

  // Fullscreen enforcement
  const enforceFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (err) {
      addToast('Fullscreen is strictly required for this session.', 'critical')
    }
  }, [addToast])

  // Security detect events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addToast('Tab switch detected! This incident has been recorded.', 'critical')
        recordViolation(sessionId, 'tab_switch', 'Student switched away from the exam tab', 'critical')
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        addToast('Fullscreen exited! Re-entry is required to continue.', 'warning')
        recordViolation(sessionId, 'fullscreen_exit', 'Student exited fullscreen mode', 'medium')
      } else {
        setIsFullscreen(true)
      }
    }
    
    const handleContext = (e: MouseEvent) => e.preventDefault()
    
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'x', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        addToast('Shortcut key disabled for security.', 'info')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContext)
    window.addEventListener('keydown', handleKeydown)

    enforceFullscreen()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', handleContext)
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [enforceFullscreen, addToast, sessionId])

  // Admin Commands
  useEffect(() => {
    const supabase = createClient()
    const adminChannel = supabase.channel(`host-${sessionId}`)
      .on('broadcast', { event: 'admin-command' }, (payload) => {
         const { command, message } = payload.payload
         if (command === 'WARNING') {
            addToast(`OFFICIAL WARNING: ${message}`, 'critical')
            recordViolation(sessionId, 'admin_warning', `Admin issued explicit text warning: ${message}`, 'high')
         } else if (command === 'TERMINATE') {
            alert(`EXAM TERMINATED BY ADMIN: ${message}`)
            autoSubmit()
         }
      })
      .subscribe()

    return () => { supabase.removeChannel(adminChannel) }
  }, [sessionId, addToast, autoSubmit])

  const handleProctoringWarning = useCallback((msg: string) => {
    addToast(msg, msg.includes('Multiple') ? 'critical' : 'warning')
    
    let type = 'ai_warning'
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'

    if (msg.includes('Face not detected')) { type = 'face_missing'; severity = 'high' }
    if (msg.includes('Multiple faces')) { type = 'multiple_faces'; severity = 'critical' }
    if (msg.includes('Speaking')) { type = 'speaking'; severity = 'high' }
    if (msg.includes('Screen sharing stopped')) { type = 'screen_stop'; severity = 'critical' }
    if (msg.includes('Mobile Phone')) { type = 'phone_disconnected'; severity = 'high' }

    recordViolation(sessionId, type, msg, severity)
  }, [addToast, sessionId])

  // Mobile reconnection
  useEffect(() => {
    if (!pairingId) return
    let peerInstance: any = null
    let retryTimeout: NodeJS.Timeout

    const initializePeer = () => {
      import('peerjs').then(({ default: Peer }) => {
        const peer = new Peer(pairingId)
        peerInstance = peer
        peer.on('call', (call: any) => {
          call.answer()
          call.on('stream', (remoteStream: MediaStream) => {
            setMobileStream(remoteStream)
            setPhoneStatus('success')
            addToast('Secondary camera feed established.', 'info')
          })
          call.on('close', () => {
            setMobileStream(null)
            setPhoneStatus('error')
            handleProctoringWarning('Mobile Phone Disconnected. Return phone to exam mode.')
          })
        })
        
        peer.on('connection', (conn: any) => {
           conn.on('open', () => {
              conn.send({ sessionId })
           })
        })

        peer.on('error', () => { setPhoneStatus('error') })
      })
    }

    retryTimeout = setTimeout(initializePeer, 1500)
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (peerInstance) peerInstance.destroy()
    }
  }, [pairingId, handleProctoringWarning, addToast])

  const handleAnswerSelect = (qId: string, value: string) => {
    const newAnswers = { ...answers, [qId]: value }
    setAnswers(newAnswers)
    setSaveStatus('Saving...')
    try { localStorage.setItem(`exam_answers_${sessionId}`, JSON.stringify(newAnswers)) } catch(e) {}
    setTimeout(() => setSaveStatus('Saved'), 1000)
  }

  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0F14] flex flex-col items-center justify-center text-white p-10 select-none">
        <div className="bg-destructive/10 p-6 rounded-full border border-destructive/20 animate-pulse mb-8">
           <AlertOctagon size={64} className="text-destructive" />
        </div>
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Security Protocol Violation</h2>
        <p className="text-secondary-foreground text-center max-w-lg mb-10 font-bold opacity-60 leading-relaxed uppercase text-xs tracking-widest">
          The AI Proctoring engine has paused your attempt because Fullscreen mode was disabled. 
          Persistent violations will lead to automatic disqualification.
        </p>
        <button 
          onClick={enforceFullscreen}
          className="bg-primary hover:bg-primary/90 text-white font-black py-4 px-12 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95"
        >
          Resume Safe Session
        </button>
      </div>
    )
  }

  const question = questions[currentQuestionIdx]

  return (
    <div className="min-h-screen bg-[#0B0F14] text-foreground flex flex-col select-none overflow-hidden font-sans">
      
      {/* Dynamic Navbar */}
      <header className="h-18 px-8 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                 <ShieldCheck size={20} className="text-primary" />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-foreground truncate max-w-[200px]">{exam.title}</h1>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-success">Live Integrity Monitoring</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-40 mb-1">Time Remaining</span>
              <div className={`flex items-center gap-1.5 font-black text-2xl tracking-tighter tabular-nums ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                 <Clock size={20} className="opacity-40" />
                 {formatTime(timeLeft)}
              </div>
           </div>
           <button 
             onClick={() => setIsSubmitModalOpen(true)}
             className="bg-destructive text-white py-3 px-8 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-destructive/90 shadow-lg shadow-destructive/20 active:scale-95"
           >
             End Session
           </button>
        </div>
      </header>

      {/* Main Container: 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Question Navigation */}
        <aside className="w-72 border-r border-border bg-card/30 flex flex-col">
           <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-40">Section 01</span>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">{Object.keys(answers).length}/{questions.length} Answered</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-500" 
                   style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                 />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-4 gap-2">
                 {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined
                    const isCurrent = currentQuestionIdx === idx
                    return (
                       <button
                         key={q.id}
                         onClick={() => setCurrentQuestionIdx(idx)}
                         className={`h-12 rounded-xl border flex items-center justify-center text-sm font-black transition-all ${
                           isCurrent 
                             ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                             : isAnswered 
                               ? 'bg-success/5 border-success/30 text-success' 
                               : 'bg-muted/10 border-border text-secondary-foreground hover:border-primary/40'
                         }`}
                       >
                          {String(idx + 1).padStart(2, '0')}
                       </button>
                    )
                 })}
              </div>
           </div>

           <div className="p-6 border-t border-border bg-muted/5">
              <div className="flex items-center gap-3 text-secondary-foreground">
                 <div className={`flex items-center gap-2 text-xs font-bold ${saveStatus === 'Saving...' ? 'text-primary' : 'text-success opacity-60'}`}>
                    {saveStatus === 'Saved' && <CheckCircle size={14} />}
                    {saveStatus || 'Ready'}
                 </div>
              </div>
           </div>
        </aside>

        {/* Center Panel: Content */}
        <main className="flex-1 bg-[#0B0F14] flex flex-col p-10 overflow-y-auto custom-scrollbar relative">
           <div className="max-w-3xl mx-auto w-full space-y-10 pb-20">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 group">
                    <div className="w-8 h-[2px] bg-primary group-hover:w-12 transition-all" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Question {currentQuestionIdx + 1}</span>
                 </div>
                 <h2 className="text-3xl font-black text-foreground leading-[1.3] tracking-tight">
                    {question?.question_text || "Initializing encrypted request..."}
                 </h2>
              </div>

              <div className="space-y-4">
                 {question?.type === 'mcq' && (
                    <div className="grid grid-cols-1 gap-4">
                       {((typeof question.options === 'string' ? JSON.parse(question.options || '[]') : question.options) as string[]).map((opt, idx) => {
                          const isSelected = answers[question.id] === opt
                          return (
                             <button
                               key={idx}
                               onClick={() => handleAnswerSelect(question.id, opt)}
                               className={`group w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 relative overflow-hidden ${
                                 isSelected 
                                   ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' 
                                   : 'border-border bg-card/20 hover:border-primary/40'
                               }`}
                             >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-colors ${
                                   isSelected ? 'bg-primary border-primary text-white' : 'bg-muted border-border text-secondary-foreground group-hover:border-primary/40'
                                }`}>
                                   {String.fromCharCode(65 + idx)}
                                </div>
                                <span className={`text-lg font-bold transition-colors ${isSelected ? 'text-foreground' : 'text-secondary-foreground'}`}>
                                   {opt}
                                </span>
                                {isSelected && <div className="absolute right-6"><CheckCircle size={20} className="text-primary" /></div>}
                             </button>
                          )
                       })}
                    </div>
                 )}

                 {question?.type === 'subjective' && (
                    <div className="relative">
                       <textarea
                         value={answers[question.id] || ''}
                         onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                         className="w-full h-80 p-8 rounded-3xl bg-card/20 border-2 border-border focus:border-primary text-lg font-medium text-foreground outline-none resize-none transition-all placeholder:opacity-20 scrollbar-none"
                         placeholder="Synthesize your comprehensive response here..."
                         onPaste={(e) => e.preventDefault()}
                       />
                       <div className="absolute bottom-6 right-8 text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-30">
                          Secure Input Monitoring Active
                       </div>
                    </div>
                 )}
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-border/50">
                 <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-secondary-foreground border border-border hover:bg-card active:scale-95 disabled:opacity-20 transition-all"
                 >
                    <ChevronLeft size={16} /> Previous
                 </button>
                 
                 {currentQuestionIdx < questions.length - 1 ? (
                   <button
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                   >
                      Next Question <ChevronRight size={16} />
                   </button>
                 ) : (
                   <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="flex items-center gap-2 bg-success text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-success/90 shadow-lg shadow-success/20 active:scale-95 transition-all"
                   >
                      Finalize Attempt <ShieldCheck size={16} />
                   </button>
                 )}
              </div>
           </div>
        </main>

        {/* Right Panel: Proctoring HUD */}
        <aside className="w-80 border-l border-border bg-card/30 flex flex-col p-6 space-y-6">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
              <span className="text-[11px] font-black text-foreground uppercase tracking-widest">Advanced Proctoring HUD</span>
           </div>

           {/* System Nodes */}
           <div className="grid grid-cols-2 gap-3">
              <StatusNode icon={<Video size={14} />} label="Face" status={sysStatus.camera} />
              <StatusNode icon={<Mic size={14} />} label="Mic" status={sysStatus.mic} />
              <StatusNode icon={<Monitor size={14} />} label="Screen" status={sysStatus.screen} />
              <StatusNode icon={<Smartphone size={14} />} label="Mobile" status={phoneStatus} />
           </div>

           {/* Dynamic Feeds Overlay */}
           <div className="space-y-4">
              <div className="aspect-video bg-black rounded-2xl border border-border overflow-hidden relative group">
                 <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">Candidate Feed</div>
                 <div id="self-view-placeholder" className="absolute inset-0 flex items-center justify-center opacity-40">
                    <UserCheck size={32} className="text-primary" />
                 </div>
                 <canvas id="proctoring-canvas" className="absolute inset-0 w-full h-full object-cover" />
              </div>

              {pairingId && (
                 <div className="aspect-ratio-[9/16] bg-black rounded-2xl border border-border overflow-hidden relative group h-48">
                    <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">Lateral AI View</div>
                    {mobileStream ? (
                       <video 
                         autoPlay 
                         playsInline 
                         muted 
                         ref={el => { if(el) el.srcObject = mobileStream }} 
                         className="w-full h-full object-cover"
                       />
                    ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-20 capitalize">
                          <Smartphone size={32} />
                          <span className="text-[10px] font-black">Waiting for Link...</span>
                       </div>
                    )}
                 </div>
              )}
           </div>

           {/* Alert Log (Mini) */}
           <div className="flex-1 bg-black/20 rounded-2xl border border-border p-4 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-40">Security log</span>
                 <Info size={12} className="text-primary opacity-40" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                 {toasts.slice().reverse().map((t) => (
                    <div key={t.id} className="flex gap-3 text-[10px] animate-in fade-in slide-in-from-bottom-2">
                       <div className={`w-1 h-auto rounded-full ${t.type === 'critical' ? 'bg-destructive' : t.type === 'warning' ? 'bg-warning' : 'bg-primary'}`} />
                       <p className={`font-bold leading-relaxed ${t.type === 'critical' ? 'text-destructive' : 'text-secondary-foreground'}`}>
                          {t.msg}
                       </p>
                    </div>
                 ))}
                 {toasts.length === 0 && <p className="text-[10px] font-bold text-success uppercase tracking-widest opacity-40 italic">System integrity nominal...</p>}
              </div>
           </div>
        </aside>
      </div>

      {/* Floating Notifications (Toasts) */}
      <div className="fixed top-24 right-6 z-[100] space-y-4 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div key={t.id} className={`p-5 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-start gap-4 animate-in slide-in-from-right duration-500 pointer-events-auto ${
             t.type === 'critical' 
               ? 'bg-destructive/10 border-destructive/30 text-destructive' 
               : t.type === 'warning' 
                 ? 'bg-warning/10 border-warning/30 text-warning' 
                 : 'bg-card/80 border-border text-foreground'
          }`}>
             <div className="mt-1">
                {t.type === 'critical' ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
             </div>
             <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-1">{t.type === 'critical' ? 'Critical Alert' : 'System Notice'}</h4>
                <p className="text-[13px] font-bold leading-relaxed opacity-90">{t.msg}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Background Media & AI Engines */}
      {!isSubmitting && (
         <>
           <ProctoringEngine sessionId={sessionId} onWarning={handleProctoringWarning} />
           <LiveKitBroadcaster sessionId={sessionId} />
         </>
      )}

      {/* Final Confirmation */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[110] bg-[#0B0F14]/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
          <div className="bg-card rounded-3xl p-10 max-w-md w-full border border-border shadow-2xl text-center space-y-8 animate-in zoom-in-95">
             <div className="bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-primary/20">
                <CheckCircle size={40} className="text-primary" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Finalize Submission</h3>
                <p className="text-secondary-foreground text-sm font-medium opacity-60 leading-relaxed uppercase tracking-widest">
                   You have completed {Object.keys(answers).length} questions out of {questions.length}. End session current?
                </p>
             </div>
             <div className="flex flex-col gap-3">
               <button 
                 onClick={submitExamFinal}
                 className="w-full bg-success text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-success/20 hover:scale-105 active:scale-95 transition-all"
               >
                 Confirm & Terminate Session
               </button>
               <button 
                 onClick={() => setIsSubmitModalOpen(false)}
                 className="w-full text-secondary-foreground py-4 font-black text-xs uppercase tracking-widest hover:text-foreground transition-all"
               >
                 Go back to attempt
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusNode({ icon, label, status }: { icon: any, label: string, status: string }) {
  const isOnline = status === 'success'
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${isOnline ? 'bg-muted/10 border-border opacity-100' : 'bg-destructive/10 border-destructive/20 text-destructive animate-pulse'}`}>
       <div className={isOnline ? 'text-primary opacity-50' : ''}>{icon}</div>
       <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
       <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-success shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-destructive'}`} />
    </div>
  )
}

function LiveKitBroadcaster({ sessionId }: { sessionId: string }) {
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${sessionId}&username=student-${sessionId}`)
        const data = await res.json()
        if (data.token) setToken(data.token)
      } catch (e) {
        console.error('Failed to fetch LiveKit token', e)
      }
    }
    fetchToken()
  }, [sessionId])

  if (!token || !process.env.NEXT_PUBLIC_LIVEKIT_URL) return null

  return (
    <LiveKitRoom
      video={true}
      audio={false}
      screen={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      onDisconnected={() => console.log('Disconnected from LiveKit')}
    >
      <AutoScreenPublisher />
    </LiveKitRoom>
  )
}

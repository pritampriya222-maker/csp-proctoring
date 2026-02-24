'use client'

import { useState } from 'react'
import { Settings2, Rocket, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { updateExamConfig, toggleExamStatus } from './actions'

export default function ExamConfigPanel({ 
  examId, 
  initialConfig, 
  isPublished: initialIsPublished,
  totalQuestions
}: { 
  examId: string
  initialConfig: { easy: number, medium: number, hard: number }
  isPublished: boolean
  totalQuestions: { easy: number, medium: number, hard: number }
}) {
  const [config, setConfig] = useState(initialConfig)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSaveConfig = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      await updateExamConfig(examId, config)
      setMessage({ type: 'success', text: 'Protocol parameters synchronized.' })
    } catch (e) {
      setMessage({ type: 'error', text: 'Synchronization failed.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const nextStatus = !isPublished
      await toggleExamStatus(examId, nextStatus)
      setIsPublished(nextStatus)
      setMessage({ type: 'success', text: nextStatus ? 'Exam is now LIVE for students.' : 'Exam has been REVOKED.' })
    } catch (e) {
      setMessage({ type: 'error', text: 'Status update failed.' })
    } finally {
      setIsSaving(false)
    }
  }

  const totalSelected = config.easy + config.medium + config.hard

  return (
    <div className="bg-card/50 border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col">
       <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-primary/20 p-2 rounded-lg text-primary">
                <Settings2 size={18} />
             </div>
             <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Configuration HUD</h3>
          </div>
          {isPublished && (
            <div className="flex items-center gap-1.5 bg-success/10 border border-success/30 px-2 py-1 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
               <span className="text-[8px] font-black text-success uppercase tracking-widest">Live Now</span>
            </div>
          )}
       </div>

       <div className="p-6 space-y-6">
          {/* Difficulty Inputs */}
          <div className="space-y-4">
             <DifficultyInput 
               label="Easy Difficulty" 
               value={config.easy} 
               max={totalQuestions.easy} 
               onChange={(v) => setConfig(prev => ({ ...prev, easy: v }))}
               color="text-success"
             />
             <DifficultyInput 
               label="Medium Difficulty" 
               value={config.medium} 
               max={totalQuestions.medium} 
               onChange={(v) => setConfig(prev => ({ ...prev, medium: v }))}
               color="text-warning"
             />
             <DifficultyInput 
               label="Hard Difficulty" 
               value={config.hard} 
               max={totalQuestions.hard} 
               onChange={(v) => setConfig(prev => ({ ...prev, hard: v }))}
               color="text-destructive"
             />
          </div>

          <div className="pt-4 border-t border-border/50">
             <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-50">Total Questions</span>
                   <span className="text-2xl font-black text-foreground">{totalSelected} <span className="text-xs opacity-30 font-bold">Items</span></span>
                </div>
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                   <Save size={14} />
                   {isSaving ? 'Processing...' : 'Save Parameters'}
                </button>
             </div>

             <button 
               onClick={handleToggleStatus}
               disabled={isSaving}
               className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                 isPublished 
                   ? 'bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20' 
                   : 'bg-primary text-white hover:opacity-90 shadow-primary/20'
               }`}
             >
                <Rocket size={18} className={!isPublished ? 'animate-bounce' : ''} />
                {isPublished ? 'Revoke Exam Access' : 'Authorize & Start Exam'}
             </button>
          </div>

          {message && (
             <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 border ${
               message.type === 'success' ? 'bg-success/5 border-success/20 text-success' : 'bg-destructive/5 border-destructive/20 text-destructive'
             }`}>
                {message.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{message.text}</p>
             </div>
          )}
       </div>
    </div>
  )
}

function DifficultyInput({ label, value, max, onChange, color }: { label: string, value: number, max: number, onChange: (v: number) => void, color: string }) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest opacity-60 italic">{label}</label>
          <span className={`text-[10px] font-black ${color} tracking-widest`}>{value} / {max} <span className="opacity-30">Available</span></span>
       </div>
       <input 
         type="range" 
         min="0" 
         max={max} 
         value={value} 
         onChange={(e) => onChange(parseInt(e.target.value))}
         className="w-full h-1.5 bg-muted rounded-none appearance-none cursor-pointer accent-primary"
       />
    </div>
  )
}

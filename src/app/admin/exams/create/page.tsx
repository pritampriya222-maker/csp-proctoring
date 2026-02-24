'use client'

import { createExam } from './actions'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, FileText, Layout, Plus, Info, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CreateExamPage() {
  const [tzOffset, setTzOffset] = useState(0)

  useEffect(() => {
    setTzOffset(new Date().getTimezoneOffset())
  }, [])

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header Area */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin" 
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-secondary-foreground hover:text-primary hover:border-primary transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">New Examination</h2>
             <p className="text-secondary-foreground text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Configure security & schedule</p>
          </div>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border overflow-hidden shadow-2xl">
        <div className="p-1 border-b border-border bg-muted/20">
           <div className="px-8 py-4 flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                 <Layout size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground">Exam Configuration Protocol</span>
           </div>
        </div>

        <form action={createExam} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                 <FileText size={14} className="opacity-40" /> Exam Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/20 font-bold"
                placeholder="e.g. Applied Cyber-Security Certification"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                 <Info size={14} className="opacity-40" /> Candidate Instructions
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/20 font-medium resize-none"
                placeholder="Outline the rules, resources, and objectives for the candidates..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="start_time" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Calendar size={14} className="opacity-40" /> Scheduled Start
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  id="start_time"
                  required
                  className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="duration_minutes" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Clock size={14} className="opacity-40" /> Time Limit (Min)
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  id="duration_minutes"
                  required
                  min="1"
                  defaultValue="60"
                  className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                />
              </div>
            </div>
          </div>
          
          <input type="hidden" name="timezone_offset" value={tzOffset} />

          <div className="pt-8 flex justify-end gap-4 border-t border-border/50">
            <Link 
              href="/admin" 
              className="px-8 py-4 bg-muted/20 text-secondary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted/40 transition-all border border-transparent"
            >
              Discard Changes
            </Link>
            <button
              type="submit"
              className="px-10 py-4 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              Deploy Examination <Plus size={18} />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
         <div className="p-2 bg-primary/20 rounded-lg text-primary mt-1">
            <ShieldCheck size={18} />
         </div>
         <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">AI Proctoring Enabled</h4>
            <p className="text-xs text-secondary-foreground font-medium opacity-60 leading-relaxed uppercase tracking-widest">
               All examinations are protected by live biometric verification, screen monitoring, and secondary device pair-locking by default.
            </p>
         </div>
      </div>
    </div>
  )
}

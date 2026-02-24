'use client'

import { User, Bell, ShieldCheck } from 'lucide-react'

export default function Navbar({ 
  title, 
  userName, 
  status = 'Monitoring Active' 
}: { 
  title: string, 
  userName?: string,
  status?: string 
}) {
  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            AI Proctored Session
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-bold text-secondary-foreground uppercase tracking-tighter">Status</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-foreground">{status}</span>
          </div>
        </div>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-foreground">
              {userName || 'User'}
            </span>
            <span className="text-[10px] text-secondary-foreground font-medium uppercase tracking-widest">
              Online
            </span>
          </div>
          <div className="p-2 bg-muted rounded-lg text-secondary-foreground border border-border">
            <User size={18} />
          </div>
        </div>

        <button className="p-2 text-secondary-foreground hover:text-foreground transition-colors">
          <Bell size={20} />
        </button>
      </div>
    </header>
  )
}

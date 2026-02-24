'use client'

import { useSearchParams } from 'next/navigation'
import { login, signup } from './actions'
import { useState } from 'react'
import { Suspense } from 'react'
import { ShieldCheck, Mail, Lock, User, ArrowRight, BrainCircuit } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20 shadow-2xl mb-4 group hover:scale-105 transition-transform">
            <BrainCircuit size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-1">ProctorAI</h2>
          <p className="text-secondary-foreground text-xs font-bold uppercase tracking-[0.3em] opacity-40">Secure Examination Intelligence</p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-10 shadow-2xl relative overflow-hidden group">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">
            {isSignUp ? 'Establish Credentials' : 'Secure Authorization'}
          </h1>
          <p className="text-secondary-foreground text-sm font-medium opacity-60 mb-8">
            {isSignUp ? 'Create your encrypted proctoring profile.' : 'Identify yourself to enter the testing environment.'}
          </p>
          
          {error && (
            <div className="mb-6 p-4 text-xs font-bold uppercase tracking-widest text-destructive bg-destructive/10 border border-destructive/20 rounded-xl" role="alert">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 text-xs font-bold uppercase tracking-widest text-success bg-success/10 border border-success/20 rounded-xl" role="alert">
              {message}
            </div>
          )}

          <form className="space-y-5 relative">
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest ml-1" htmlFor="full_name">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required={isSignUp}
                      placeholder="e.g. Alexander Pierce"
                      className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/20"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest ml-1" htmlFor="role">
                    Access Level
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="student"
                    className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="student">Candidate / Student</option>
                    <option value="admin">Proctor / Faculty</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest ml-1" htmlFor="email">
                Identity Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@organization.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest ml-1" htmlFor="password">
                Security Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/20"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                formAction={isSignUp ? signup : login}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                {isSignUp ? 'Register Account' : 'Initialize Access'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="mt-10 text-center relative z-10">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-black text-secondary-foreground hover:text-primary uppercase tracking-widest transition-colors opacity-60 hover:opacity-100"
            >
              {isSignUp ? 'Already authenticated? Sign in' : "Lack an account? Request Access"}
            </button>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-8 flex justify-center items-center gap-6 opacity-40">
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-secondary-foreground" />
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary-foreground">256-bit AES</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-secondary-foreground/20" />
           <span className="text-[9px] font-black uppercase tracking-widest text-secondary-foreground">Compliant Node</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-primary animate-pulse font-black uppercase tracking-widest">Booting Security Ops...</div>}>
      <LoginForm />
    </Suspense>
  )
}

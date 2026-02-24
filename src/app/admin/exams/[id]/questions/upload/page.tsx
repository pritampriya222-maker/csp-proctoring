import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Layout, Info, Check, HelpCircle } from 'lucide-react'
import { addQuestion } from './actions'

export default async function AddQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!exam) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header Area */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/admin/exams/${exam.id}`} 
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-secondary-foreground hover:text-primary hover:border-primary transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
           <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Append Protocol</h2>
           <p className="text-secondary-foreground text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Add question to {exam.title}</p>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border overflow-hidden shadow-2xl">
        <div className="p-1 border-b border-border bg-muted/20">
           <div className="px-8 py-4 flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                 <FileText size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground">Intelligence Input</span>
           </div>
        </div>

        <form action={addQuestion} className="p-10 space-y-8">
          <input type="hidden" name="exam_id" value={exam.id} />

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="question_text" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                 <HelpCircle size={14} className="opacity-40" /> Question Text
              </label>
              <textarea
                name="question_text"
                id="question_text"
                rows={4}
                required
                className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-secondary-foreground/20 font-bold resize-none"
                placeholder="Declare the investigative query..."
              />
            </div>

            <div className="space-y-2">
               <label htmlFor="type" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Layout size={14} className="opacity-40" /> Response Type
               </label>
               <select 
                 name="type" 
                 id="type" 
                 className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold appearance-none cursor-pointer"
               >
                  <option value="mcq">Multiple Choice Question (MCQ)</option>
                  <option value="subjective">Subjective / Text Analysis</option>
               </select>
            </div>

            <div className="bg-muted/10 p-8 rounded-3xl border border-border/50 space-y-6">
              <div className="flex items-center gap-2">
                 <Info size={14} className="text-primary opacity-50" />
                 <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest">Options (For MCQ only)</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-secondary-foreground uppercase tracking-widest ml-1">Option Alpha</label>
                  <input type="text" name="option_a" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:border-primary/50 outline-none text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-secondary-foreground uppercase tracking-widest ml-1">Option Beta</label>
                  <input type="text" name="option_b" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:border-primary/50 outline-none text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-secondary-foreground uppercase tracking-widest ml-1">Option Gamma</label>
                  <input type="text" name="option_c" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:border-primary/50 outline-none text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-secondary-foreground uppercase tracking-widest ml-1">Option Delta</label>
                  <input type="text" name="option_d" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:border-primary/50 outline-none text-sm font-bold" />
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <label htmlFor="correct_answer" className="text-[11px] font-black text-secondary-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Check size={14} className="text-success opacity-60" /> Verified Answer
                </label>
                <input 
                  type="text" 
                  name="correct_answer" 
                  id="correct_answer" 
                  className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-foreground focus:border-success/50 outline-none font-bold placeholder:opacity-20"
                  placeholder="EXACT string of the correct variant..."
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4 border-t border-border/50">
            <Link 
              href={`/admin/exams/${exam.id}`} 
              className="px-8 py-4 bg-muted/20 text-secondary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted/40 transition-all border border-transparent"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-10 py-4 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              Commit Question <Plus size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

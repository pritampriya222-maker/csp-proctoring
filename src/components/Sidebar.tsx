'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  LogOut,
  BrainCircuit
} from 'lucide-react'
import { signout } from '@/app/login/actions'

const navItems = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, role: 'student' },
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, role: 'admin' },
  { name: 'My Exams', href: '/student/dashboard', icon: BookOpen, role: 'student' },
  { name: 'Exam Management', href: '/admin', icon: BookOpen, role: 'admin' },
  { name: 'Results', href: '/student/dashboard', icon: BarChart3, role: 'student' },
  { name: 'Proctoring Log', href: '/admin', icon: ShieldAlert, role: 'admin' },
  { name: 'Settings', href: '#', icon: Settings, role: 'any' },
]

export default function Sidebar({ role }: { role: 'admin' | 'student' }) {
  const pathname = usePathname()

  const filteredItems = navItems.filter(item => 
    item.role === 'any' || item.role === role
  )

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-lg">
          <BrainCircuit className="text-primary" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground uppercase">ProctorAI</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={`${item.name}-${item.href}`}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-secondary-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-secondary-foreground group-hover:text-primary transition-colors'} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <form action={signout}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-4 py-3 text-destructive-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  )
}

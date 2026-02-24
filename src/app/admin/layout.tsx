import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar role="admin" />
      <div className="flex-1 ml-64 flex flex-col min-h-screen transition-all duration-300">
        <Navbar 
          title="Admin Control Center" 
          userName={profile?.full_name || user.email || ''} 
          status="System Monitoring Active"
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

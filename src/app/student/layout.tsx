import { signout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
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

  if (profile?.role === 'admin') {
    // Admins usually shouldn't be in the student view as a student, but they might test it.
    // For now we will allow them or we could redirect them:
    // redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm border text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {profile?.full_name || user.email}
              </span>
              <form action={signout}>
                <button
                  type="submit"
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full mt-6">
        {children}
      </main>
    </div>
  )
}

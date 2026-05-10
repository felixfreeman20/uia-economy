import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen bg-vox-black">
      <Sidebar balance={profile.vox_balance} username={profile.username} />
      <main className="flex-1 ml-60 p-8 animate-fade-in">
        {children}
      </main>
    </div>
  )
}

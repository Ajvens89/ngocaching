import { redirect } from 'next/navigation'
import { createServerDataClient } from '@/lib/data-server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const dataClient = createServerDataClient()
  const { data: { user } } = await dataClient.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await dataClient.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')
  return <>{children}</>
}

import { cookies } from 'next/headers'
import { getServerDemoClient } from './demo-client'

export function createServerDataClient() {
  const cookieStore = cookies()
  return getServerDemoClient(cookieStore as any)
}

export function createAdminDataClient() {
  const cookieStore = cookies()
  return getServerDemoClient(cookieStore as any)
}

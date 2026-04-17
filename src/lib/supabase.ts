import { getBrowserDemoClient } from './demo-client'

let client: ReturnType<typeof getBrowserDemoClient> | null = null

export function createClient() {
  return getBrowserDemoClient()
}

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAppClient } from '@/lib/data-client'

export default function RegisterPage() {
  const router = useRouter()
  const dataClient = getAppClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await dataClient.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/profile')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Rejestracja</h1>
          <p className="text-slate-400 text-sm mt-1">Utwórz konto i zapisuj swoje odkrycia.</p>
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">E-mail</label>
          <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Hasło</label>
          <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Tworzenie konta...' : 'Utwórz konto'}</button>
        <p className="text-sm text-slate-400 text-center">Masz już konto? <Link href="/auth/login" className="text-brand-400 hover:text-brand-300">Zaloguj się</Link></p>
      </form>
    </div>
  )
}

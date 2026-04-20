'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAppClient } from '@/lib/data-client'

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  const router = useRouter()
  const dataClient = getAppClient()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await dataClient.auth.signInWithPassword({ email, password })
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
          <h1 className="text-2xl font-bold text-white">Logowanie</h1>
          <p className="text-slate-400 text-sm mt-1">
            Zaloguj się, aby zapisywać postępy w MiejskiTrop.
          </p>
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">E-mail</label>
          <input
            type="email"
            autoComplete="email"
            className="input-field"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="twoj@email.pl"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Hasło</label>
          <input
            type="password"
            autoComplete="current-password"
            className="input-field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>

        {/* Konta demo — tylko lokalnie, ukryte na produkcji */}
        {IS_DEV && (
          <div className="text-xs text-slate-600 space-y-0.5 border border-slate-800 rounded-xl p-3">
            <p className="font-semibold text-slate-500 mb-1">Środowisko dev — konta demo:</p>
            <p><code className="text-slate-400">demo@miejski.pl</code> / demo123</p>
            <p><code className="text-slate-400">admin@miejski.pl</code> / admin123</p>
          </div>
        )}

        <p className="text-sm text-slate-400 text-center">
          Nie masz konta?{' '}
          <Link href="/auth/register" className="text-brand-400 hover:text-brand-300">
            Zarejestruj się bezpłatnie
          </Link>
        </p>

        {/* Trust bar */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { icon: '🔒', label: 'Szyfrowane' },
            { icon: '🚫', label: 'Bez reklam' },
            { icon: '🤝', label: 'Open source' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="text-xs">{icon}</span>
              <span className="text-[10px] text-slate-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}

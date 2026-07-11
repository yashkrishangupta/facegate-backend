'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '../../lib/config'
import { saveSession } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const json = await res.json()

      // Debug visibility — remove once login is confirmed stable. Check
      // the browser console: this shows exactly what the backend sent
      // back, which is the fastest way to tell "backend problem" from
      // "frontend problem" if this still doesn't redirect.
      console.log('Login response:', res.status, json)

      const loginSucceeded = res.ok && json.success === true && json.data?.token && json.data?.admin

      if (!loginSucceeded) {
        setError(json.message || 'Invalid username or password')
        setLoading(false)
        return
      }

      saveSession(json.data.token, json.data.admin)
      router.push('/')
      // Deliberately no setLoading(false) here — the page is navigating
      // away, and flipping loading back off first causes a one-frame
      // flash of the enabled form right before the redirect fires.
    } catch (err) {
      console.error('Login request failed:', err)
      setError('Network error — is the API server running?')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white flex items-center justify-center p-8">
      <form onSubmit={handleLogin} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">FaceGate</h1>
        <p className="text-[#90A6BD] text-sm text-center mb-6">Sign in to the admin dashboard</p>
        {error && <p className="text-[#F87171] text-sm mb-4 text-center">{error}</p>}
        <div className="flex flex-col gap-3">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full mt-5 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </main>
  )
}
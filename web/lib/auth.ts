import { API_URL } from './config'

const TOKEN_KEY = 'facegate_token'
const ADMIN_KEY = 'facegate_admin'

export interface AdminInfo {
  admin_id: string
  username: string
  first_name: string
  last_name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FACULTY' | 'VIEWER'
  faculty_id?: string | null
}

// Deliberately in-memory + sessionStorage, not localStorage — matches the
// artifact-storage guidance (localStorage isn't reliably available) and
// naturally logs the admin out when the browser tab closes.
export function saveSession(token: string, admin: AdminInfo | null | undefined) {
  if (!token || !admin) {
    // Guards against ever writing the literal string "undefined" into
    // storage (JSON.stringify(undefined) → undefined → coerced to the
    // 4-char string "undefined" by setItem) — that string isn't valid
    // JSON, so a later getAdmin() would throw instead of just returning
    // null. Only ever call this with both values actually present.
    console.error('saveSession called with missing token or admin — refusing to store', { token, admin })
    return
  }
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getAdmin(): AdminInfo | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(ADMIN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // Corrupted/stale value from before this guard existed — clear it so
    // this doesn't keep throwing on every page load.
    clearSession()
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_KEY)
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * Wraps fetch with the Authorization header every protected route now
 * needs. Use this instead of the bare `fetch` on every page that talks to
 * the API — a 401 means the session expired/was invalid, so we clear it
 * and bounce to /login rather than leaving the page stuck on a silent
 * failure.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 && typeof window !== 'undefined') {
    // Log the real reason before clearing anything — a silent instant
    // bounce back to /login (e.g. right after a successful login, when
    // the dashboard's first apiFetch call 401s) looks like "nothing
    // happened" with no way to tell why. Check this in DevTools console.
    const body = await res.clone().json().catch(() => null)
    console.error(`apiFetch: 401 on ${path}`, body?.message || '(no message in response)')

    if (window.location.pathname !== '/login') {
      clearSession()
      window.location.href = '/login'
    }
  }

  return res
}
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

interface ChangeEntry {
  change_log_id: string
  entity_name: string
  entity_id: string | null
  action: string
  old_values: any
  new_values: any
  action_timestamp: string
  first_name?: string
  last_name?: string
  username?: string
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SYNC', 'RESOLVE', 'EXPORT']
const ENTITIES = ['room', 'device', 'faculty', 'department', 'subject', 'admin_user', 'student', 'timetable', 'holiday']

const actionColor: Record<string, string> = {
  CREATE: 'bg-[#14532D] text-[#4ADE80]',
  DELETE: 'bg-[#2A1A1A] text-[#F87171]',
  UPDATE: 'bg-[#1E3A5F] text-[#5DA9FF]',
  LOGIN: 'bg-[#3A2E14] text-[#FBBF24]',
}

export default function ChangeLogPage() {
  const router = useRouter()
  const [items, setItems] = useState<ChangeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ entity_name: '', action: '' })

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    fetchItems()
  }, [filters])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.entity_name) params.set('entity_name', filters.entity_name)
      if (filters.action) params.set('action', filters.action)
      const res = await apiFetch(`/change-log?${params}`)
      const json = await res.json()
      setItems(json.data || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Change Log</h1>
        </div>
        <div className="flex gap-3 mb-6">
          <select value={filters.entity_name} onChange={(e) => setFilters(p => ({ ...p, entity_name: e.target.value }))}
            className="bg-[#1A2436] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm">
            <option value="">All Entities</option>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filters.action} onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}
            className="bg-[#1A2436] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm">
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {loading ? (
          <p className="text-[#90A6BD]">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">No changes logged yet</div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((c) => (
              <div key={c.change_log_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${actionColor[c.action] || 'bg-[#2F4E73] text-[#90A6BD]'}`}>{c.action}</span>
                    <span className="text-white text-sm font-mono">{c.entity_name}</span>
                  </div>
                  <p className="text-[#90A6BD] text-xs mt-1">
                    {c.first_name ? `${c.first_name} ${c.last_name} (${c.username})` : 'System'} · {new Date(c.action_timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

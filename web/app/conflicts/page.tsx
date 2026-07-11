'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

interface Conflict {
  conflict_id: string
  student_name?: string
  device_name?: string
  room_number?: string
  conflict_type: string
  severity: string
  status: string
  created_at: string
}

interface Room { room_id: string; room_number: string }

const CONFLICT_TYPES = ['LOW_CONFIDENCE', 'DUPLICATE_ATTENDANCE', 'SYNC_FAILURE', 'MANUAL_REVIEW', 'DEVICE_ERROR', 'UNKNOWN_FACE']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const inputCls = "bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"

export default function ConflictsPage() {
  const router = useRouter()
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Conflict | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const [filters, setFilters] = useState({
    status: 'PENDING', severity: '', conflict_type: '', room_id: '', from_date: '', to_date: ''
  })

  const fetchConflicts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await apiFetch(`/conflicts?${params}`)
      const json = await res.json()
      setConflicts(json.data || [])
    } catch { setConflicts([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    apiFetch('/rooms').then(r => r.json()).then(j => setRooms(j.data || [])).catch(() => {})
  }, [])

  useEffect(() => { fetchConflicts() }, [filters])

  const handleResolve = async (id: string) => {
    setResolving(true)
    try {
      await apiFetch(`/conflicts/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution: resolveNote })
      })
      setSelected(null); setResolveNote(''); fetchConflicts()
    } catch {} finally { setResolving(false) }
  }

  const handleDismiss = async (id: string) => {
    if (!confirm('Dismiss this conflict?')) return
    await apiFetch(`/conflicts/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchConflicts()
  }

  const severityColors: Record<string, string> = {
    LOW: 'bg-[#14532D] text-[#4ADE80]',
    MEDIUM: 'bg-[#2A1A00] text-[#F59E0B]',
    HIGH: 'bg-[#2A1A1A] text-[#F87171]',
    CRITICAL: 'bg-[#3A0A0A] text-[#FF4444]',
  }

  const clearable = filters.severity || filters.conflict_type || filters.room_id || filters.from_date || filters.to_date

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Conflict Queue</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {['PENDING', 'RESOLVED'].map((f) => (
            <button key={f} onClick={() => setFilters(p => ({ ...p, status: f }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.status === f ? 'bg-[#1E3A5F] text-[#5DA9FF]' : 'text-[#90A6BD] hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filters.severity} onChange={(e) => setFilters(p => ({ ...p, severity: e.target.value }))} className={inputCls}>
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.conflict_type} onChange={(e) => setFilters(p => ({ ...p, conflict_type: e.target.value }))} className={inputCls}>
            <option value="">All Types</option>
            {CONFLICT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={filters.room_id} onChange={(e) => setFilters(p => ({ ...p, room_id: e.target.value }))} className={inputCls}>
            <option value="">All Rooms</option>
            {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
          </select>
          <input type="date" value={filters.from_date} onChange={(e) => setFilters(p => ({ ...p, from_date: e.target.value }))} className={inputCls} />
          <input type="date" value={filters.to_date} onChange={(e) => setFilters(p => ({ ...p, to_date: e.target.value }))} className={inputCls} />
          {clearable && (
            <button onClick={() => setFilters(p => ({ ...p, severity: '', conflict_type: '', room_id: '', from_date: '', to_date: '' }))} className="text-[#F87171] text-sm px-2">Clear</button>
          )}
        </div>

        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : conflicts.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-[#4ADE80] font-bold">No conflicts match these filters</p>
            <p className="text-[#4A6080] text-sm mt-1">Ambiguous face matches will appear here for review</p>
          </div>
        ) : (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-[#2F4E73]">
                {['Student', 'Type', 'Severity', 'Room', 'Detected', 'Actions'].map(h => (
                  <th key={h} className="text-left p-4 text-[#90A6BD] text-sm font-bold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {conflicts.map((c) => (
                  <tr key={c.conflict_id} className="border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors">
                    <td className="p-4 text-white">{c.student_name || '—'}</td>
                    <td className="p-4 text-[#90A6BD] text-sm">{c.conflict_type?.replace(/_/g, ' ')}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${severityColors[c.severity] || ''}`}>{c.severity}</span></td>
                    <td className="p-4 text-[#90A6BD] text-sm">{c.room_number || '—'}</td>
                    <td className="p-4 text-[#90A6BD] text-sm">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      {c.status === 'PENDING' && (
                        <div className="flex gap-3">
                          <button onClick={() => setSelected(c)} className="text-[#5DA9FF] text-sm hover:text-white transition-colors">Resolve</button>
                          <button onClick={() => handleDismiss(c.conflict_id)} className="text-[#F87171] text-sm hover:text-white transition-colors">Dismiss</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-2">Resolve Conflict</h2>
              <p className="text-[#90A6BD] text-sm mb-4">{selected.student_name} — {selected.conflict_type?.replace(/_/g, ' ')}</p>
              <textarea placeholder="Resolution notes..." value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)} rows={3}
                className="w-full bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF] resize-none" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelected(null)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={() => handleResolve(selected.conflict_id)} disabled={resolving}
                  className="flex-1 bg-[#5DA9FF] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                  {resolving ? 'Resolving...' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

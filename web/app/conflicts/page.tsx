'use client'
import { useEffect, useState } from 'react'
import client from '../api/client'

interface Conflict {
  id: string; studentName?: string; conflictType: string
  severity: string; status: string; detectedAt: string
}

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Conflict | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [filter, setFilter] = useState('PENDING')

  const fetchConflicts = async () => {
    setLoading(true)
    try {
      const res = await client.get('/api/v1/conflicts', { params: { status: filter } })
      setConflicts(res.data.data || res.data.conflicts || [])
    } catch { setConflicts([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchConflicts() }, [filter])

  const handleResolve = async (id: string) => {
    setResolving(true)
    try {
      await client.put(`/api/v1/conflicts/${id}/resolve`, { resolutionNotes: resolveNote, actionTaken: 'MARK_PRESENT' })
      setSelected(null); setResolveNote(''); fetchConflicts()
    } catch {} finally { setResolving(false) }
  }

  const handleDismiss = async (id: string) => {
    if (!confirm('Dismiss this conflict?')) return
    await client.delete(`/api/v1/conflicts/${id}`).catch(() => {})
    fetchConflicts()
  }

  const severityColors: Record<string, string> = {
    LOW: 'bg-[#14532D] text-[#4ADE80]',
    MEDIUM: 'bg-[#2A1A00] text-[#F59E0B]',
    HIGH: 'bg-[#2A1A1A] text-[#F87171]',
    CRITICAL: 'bg-[#3A0A0A] text-[#FF4444]',
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Conflict Queue</h1>
        </div>
        <div className="flex gap-2 mb-6">
          {['PENDING','RESOLVED'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-[#1E3A5F] text-[#5DA9FF]' : 'text-[#90A6BD] hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : conflicts.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-[#4ADE80] font-bold">No open conflicts</p>
            <p className="text-[#4A6080] text-sm mt-1">Ambiguous face matches will appear here for review</p>
          </div>
        ) : (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-[#2F4E73]">
                {['Student','Type','Severity','Detected','Actions'].map(h => (
                  <th key={h} className="text-left p-4 text-[#90A6BD] text-sm font-bold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {conflicts.map((c) => (
                  <tr key={c.id} className="border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors">
                    <td className="p-4 text-white">{c.studentName || '—'}</td>
                    <td className="p-4 text-[#90A6BD] text-sm">{c.conflictType?.replace(/_/g,' ')}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${severityColors[c.severity] || ''}`}>{c.severity}</span></td>
                    <td className="p-4 text-[#90A6BD] text-sm">{new Date(c.detectedAt).toLocaleString()}</td>
                    <td className="p-4">
                      {c.status === 'PENDING' && (
                        <div className="flex gap-3">
                          <button onClick={() => setSelected(c)} className="text-[#5DA9FF] text-sm hover:text-white transition-colors">Resolve</button>
                          <button onClick={() => handleDismiss(c.id)} className="text-[#F87171] text-sm hover:text-white transition-colors">Dismiss</button>
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
              <p className="text-[#90A6BD] text-sm mb-4">{selected.studentName} — {selected.conflictType?.replace(/_/g,' ')}</p>
              <textarea placeholder="Resolution notes..." value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)} rows={3}
                className="w-full bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF] resize-none" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelected(null)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={() => handleResolve(selected.id)} disabled={resolving}
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

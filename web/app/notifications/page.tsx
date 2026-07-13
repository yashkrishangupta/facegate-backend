'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin } from '../../lib/auth'

interface Notification {
  notification_id: string
  title: string
  message: string
  type: string
  priority: string
  is_read: boolean
  created_at: string
}

const TYPES = ['SYSTEM', 'ATTENDANCE', 'DEVICE', 'CONFLICT', 'SYNC', 'HOLIDAY', 'TIMETABLE', 'SECURITY', 'ANNOUNCEMENT']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const inputCls = "bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"

const priorityColor: Record<string, string> = {
  LOW: 'bg-[#14532D] text-[#4ADE80]',
  MEDIUM: 'bg-[#2A1A00] text-[#F59E0B]',
  HIGH: 'bg-[#2A1A1A] text-[#F87171]',
  CRITICAL: 'bg-[#3A0A0A] text-[#FF4444]',
}

export default function NotificationsPage() {
  const router = useRouter()
  const admin = getAdmin()
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN'

  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', message: '', type: TYPES[0], priority: PRIORITIES[1] })

  const fetchItems = async () => {
    setLoading(true)
    try { const res = await apiFetch('/notifications'); const json = await res.json(); setItems(json.data || []) }
    catch { setItems([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    fetchItems()
  }, [])

  const handleCreate = async () => {
    setError('')
    try {
      const res = await apiFetch('/notifications', { method: 'POST', body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create notification'); return }
      setShowModal(false)
      setForm({ title: '', message: '', type: TYPES[0], priority: PRIORITIES[1] })
      fetchItems()
    } catch { setError('Network error') }
  }

  const handleMarkRead = async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PUT' }).catch(() => {})
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return
    await apiFetch(`/notifications/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchItems()
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD] text-sm">System alerts and announcements.</p>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm">+ New Notification</button>
          )}
        </div>
        {loading ? (
          <p className="text-[#90A6BD]">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">No notifications</div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((n) => (
              <div key={n.notification_id} className={`bg-[#1A2436] border rounded-2xl p-5 ${n.is_read ? 'border-[#2F4E73]' : 'border-[#5DA9FF]'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityColor[n.priority] || ''}`}>{n.priority}</span>
                      <span className="text-[#90A6BD] text-xs">{n.type}</span>
                    </div>
                    <p className="text-white font-bold mt-2">{n.title}</p>
                    <p className="text-[#90A6BD] text-sm mt-1">{n.message}</p>
                    <p className="text-[#4A6080] text-xs mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3">
                    {!n.is_read && <button onClick={() => handleMarkRead(n.notification_id)} className="text-[#5DA9FF] text-sm hover:text-white">Mark read</button>}
                    {canManage && <button onClick={() => handleDelete(n.notification_id)} className="text-[#F87171] text-sm hover:text-white">Delete</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-4">New Notification</h2>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <div className="flex flex-col gap-3">
                <input placeholder="Title" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} />
                <textarea placeholder="Message" value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowModal(false); setError('') }} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={!form.title || !form.message} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

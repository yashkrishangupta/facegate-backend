'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

interface Room {
  room_id: string
  room_number: string
  room_name?: string
  building_name: string
  floor_number?: number
  room_type: string
  capacity: number
}

const ROOM_TYPES = ['Lecture Hall', 'Laboratory', 'Seminar Hall', 'Tutorial Room', 'Conference Room']

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    roomNumber: '', roomName: '', buildingName: '', floorNumber: '',
    roomType: ROOM_TYPES[0], capacity: '30'
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/rooms')
      const json = await res.json()
      setRooms(json.data || [])
    } catch { setRooms([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    fetchRooms()
  }, [])

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      const res = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          room_number: form.roomNumber,
          room_name: form.roomName || undefined,
          building_name: form.buildingName,
          floor_number: form.floorNumber ? Number(form.floorNumber) : undefined,
          room_type: form.roomType,
          capacity: Number(form.capacity)
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to create room')
        return
      }
      setShowModal(false)
      setForm({ roomNumber: '', roomName: '', buildingName: '', floorNumber: '', roomType: ROOM_TYPES[0], capacity: '30' })
      fetchRooms()
    } catch { setError('Network error — is the API server running?') } finally { setSubmitting(false) }
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Rooms</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD]">Create a room before pairing a device to it — device pairing needs a room to assign.</p>
          <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 whitespace-nowrap">+ New Room</button>
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : rooms.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-4xl mb-4">🏫</p>
            <p className="text-[#90A6BD] font-bold">No rooms yet</p>
            <p className="text-[#4A6080] text-sm mt-1">Create one, then head to Devices to pair a tablet to it</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((r) => (
              <div key={r.room_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
                <p className="text-white font-bold">{r.room_number}{r.room_name ? ` — ${r.room_name}` : ''}</p>
                <div className="text-sm text-[#90A6BD] space-y-1 mt-2">
                  <p>{r.building_name}{r.floor_number != null ? `, Floor ${r.floor_number}` : ''}</p>
                  <p>{r.room_type} · Capacity {r.capacity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-4">New Room</h2>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <div className="flex flex-col gap-3">
                <input placeholder="Room Number (e.g. Room-101)" value={form.roomNumber}
                  onChange={(e) => setForm(p => ({ ...p, roomNumber: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Room Name (optional)" value={form.roomName}
                  onChange={(e) => setForm(p => ({ ...p, roomName: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Building Name" value={form.buildingName}
                  onChange={(e) => setForm(p => ({ ...p, buildingName: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Floor Number (optional)" type="number" value={form.floorNumber}
                  onChange={(e) => setForm(p => ({ ...p, floorNumber: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <select value={form.roomType}
                  onChange={(e) => setForm(p => ({ ...p, roomType: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]">
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder="Capacity" type="number" value={form.capacity}
                  onChange={(e) => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowModal(false); setError('') }} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting ? 'Creating...' : 'Create Room'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

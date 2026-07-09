'use client'
import { useEffect, useState } from 'react'
import client from '../api/client'

interface Holiday {
  id: string; holidayName: string; holidayDate: string
  holidayType: string; description?: string
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ holidayName: '', holidayDate: '', holidayType: 'NATIONAL', description: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchHolidays = async () => {
    setLoading(true)
    try {
      const res = await client.get('/api/v1/holidays')
      setHolidays(res.data.holidays || res.data.data || [])
    } catch { setHolidays([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchHolidays() }, [])

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      await client.post('/api/v1/holidays', form)
      setShowModal(false)
      setForm({ holidayName: '', holidayDate: '', holidayType: 'NATIONAL', description: '' })
      fetchHolidays()
    } catch (e: any) { setError(e.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this holiday?')) return
    await client.delete(`/api/v1/holidays/${id}`).catch(() => {})
    fetchHolidays()
  }

  const typeColors: Record<string, string> = {
    NATIONAL: 'bg-[#1E3A5F] text-[#5DA9FF]',
    GAZETTED: 'bg-[#14532D] text-[#4ADE80]',
    INSTITUTIONAL: 'bg-[#2A1A00] text-[#F59E0B]',
    FESTIVAL: 'bg-[#2D1A3A] text-[#A78BFA]',
    EMERGENCY: 'bg-[#2A1A1A] text-[#F87171]',
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Holidays</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD]">Attendance is not recorded on holiday dates</p>
          <button onClick={() => setShowModal(true)} className="bg-[#F87171] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90">+ Add Holiday</button>
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : holidays.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-4xl mb-4">🗓️</p>
            <p className="text-[#90A6BD] font-bold">No holidays added yet</p>
          </div>
        ) : (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-[#2F4E73]">
                {['Holiday','Date','Type','Actions'].map(h => (
                  <th key={h} className="text-left p-4 text-[#90A6BD] text-sm font-bold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {holidays.map((h) => (
                  <tr key={h.id} className="border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors">
                    <td className="p-4 text-white font-medium">{h.holidayName}</td>
                    <td className="p-4 text-[#90A6BD]">{new Date(h.holidayDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${typeColors[h.holidayType] || 'bg-[#1A2436] text-[#90A6BD]'}`}>{h.holidayType}</span></td>
                    <td className="p-4"><button onClick={() => handleDelete(h.id)} className="text-[#F87171] text-sm hover:text-white transition-colors">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-4">Add Holiday</h2>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <div className="flex flex-col gap-3">
                <input placeholder="Holiday Name" value={form.holidayName}
                  onChange={(e) => setForm(p => ({...p, holidayName: e.target.value}))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input type="date" value={form.holidayDate}
                  onChange={(e) => setForm(p => ({...p, holidayDate: e.target.value}))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <select value={form.holidayType} onChange={(e) => setForm(p => ({...p, holidayType: e.target.value}))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]">
                  {['NATIONAL','GAZETTED','INSTITUTIONAL','FESTIVAL','EMERGENCY'].map(t => <option key={t}>{t}</option>)}
                </select>
                <input placeholder="Description (optional)" value={form.description}
                  onChange={(e) => setForm(p => ({...p, description: e.target.value}))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => {setShowModal(false);setError('')}} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#F87171] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting?'Adding...':'Add Holiday'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

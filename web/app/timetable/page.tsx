'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

interface TimetableEntry {
  timetable_id: string
  batch_code: string
  faculty_name: string
  subject_name: string
  room: string
  day: string
  start_time: string
  end_time: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TimetablePage() {
  const router = useRouter()
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(DAYS[0])

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    setLoading(true)
    apiFetch('/timetable')
      .then((res) => res.json())
      .then((json) => setEntries(json.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const dayEntries = useMemo(
    () => entries
      .filter((e) => e.day?.toLowerCase() === activeDay.toLowerCase())
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [entries, activeDay]
  )

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Timetable Setup</h1>
        </div>
        <div className="flex gap-2 mb-6">
          {DAYS.map((day) => (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${activeDay === day ? 'bg-[#5DA9FF] text-white' : 'bg-[#1A2436] text-[#90A6BD] border border-[#2F4E73]'}`}>
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : dayEntries.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-[#90A6BD] font-bold">No periods for {activeDay}</p>
            <button className="mt-4 bg-[#5DA9FF] text-white font-bold px-6 py-3 rounded-xl">+ Add Period</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dayEntries.map((e) => (
              <div key={e.timetable_id} className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-5 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{e.subject_name}</p>
                  <p className="text-[#90A6BD] text-sm mt-1">{e.faculty_name} · {e.batch_code} · Room {e.room}</p>
                </div>
                <p className="text-[#5DA9FF] text-sm font-mono">{e.start_time} – {e.end_time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

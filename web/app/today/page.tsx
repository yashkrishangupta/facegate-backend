'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '../../lib/config'

interface TimetableEntry {
  timetable_id: string
  batch_code: string
  faculty_name: string
  subject_name: string
  room: string
  start_time: string
  end_time: string
}

export default function TodayPage() {
  const [sessions, setSessions] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ scheduledToday: '—', presentToday: '—', activeDevices: '—' })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_URL}/timetable/today`).then((r) => r.json()),
      fetch(`${API_URL}/dashboard/summary`).then((r) => r.json())
    ])
      .then(([timetableJson, dashboardJson]) => {
        setSessions(timetableJson.data || [])
        const d = dashboardJson.data
        setStats({
          scheduledToday: d?.todayClasses ?? '—',
          presentToday: d?.attendanceToday ?? '—',
          activeDevices: d?.activeDevices ?? '—',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Today Across All Rooms</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Scheduled Today", value: stats.scheduledToday, color: "#4ADE80" },
            { label: "Total Present", value: stats.presentToday, color: "#5DA9FF" },
            { label: "Active Devices", value: stats.activeDevices, color: "#F59E0B" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1A2436] rounded-2xl p-5 border border-[#2F4E73]">
              <p style={{ color: stat.color }} className="text-3xl font-bold">{stat.value}</p>
              <p className="text-[#90A6BD] text-xs mt-1 font-bold tracking-wide uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-4xl mb-4">🏫</p>
            <p className="text-[#90A6BD] font-bold">No sessions scheduled for today</p>
            <p className="text-[#4A6080] text-sm mt-1">Live room status will appear here when sessions are running</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <div key={s.timetable_id} className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-5 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">Room {s.room}</p>
                  <p className="text-[#90A6BD] text-sm mt-1">{s.subject_name} · {s.faculty_name} · {s.batch_code}</p>
                </div>
                <p className="text-[#5DA9FF] text-sm font-mono">{s.start_time} – {s.end_time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

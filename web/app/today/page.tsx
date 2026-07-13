'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

interface TimetableEntry {
  timetable_id: string
  batch_id: string
  batch_code: string
  faculty_name: string
  subject_name: string
  room: string
  start_time: string
  end_time: string
}

interface StudentRow {
  student_id: string
  first_name: string
  last_name: string
  roll_number: string
}

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

export default function TodayPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ scheduledToday: '—', presentToday: '—', activeDevices: '—' })

  // Manual attendance modal
  const [marking, setMarking] = useState<TimetableEntry | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [markError, setMarkError] = useState('')

  const openMarkAttendance = async (session: TimetableEntry) => {
    setMarking(session)
    setMarkError('')
    setStudentsLoading(true)
    try {
      const res = await apiFetch(`/students?batch_id=${session.batch_id}`)
      const json = await res.json()
      const list: StudentRow[] = json.data || []
      setStudents(list)
      const initial: Record<string, string> = {}
      list.forEach(s => { initial[s.student_id] = 'PRESENT' })
      setStatuses(initial)
    } catch {
      setStudents([])
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleSubmitAttendance = async () => {
    if (!marking) return
    setSubmitting(true); setMarkError('')
    try {
      const res = await apiFetch('/attendance/manual', {
        method: 'POST',
        body: JSON.stringify({
          timetable_id: marking.timetable_id,
          session_date: new Date().toISOString().slice(0, 10),
          records: Object.entries(statuses).map(([student_id, status]) => ({ student_id, status }))
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setMarkError(json.message || 'Failed to mark attendance'); return }
      setMarking(null)
    } catch {
      setMarkError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    setLoading(true)
    Promise.all([
      apiFetch('/timetable/today').then((r) => r.json()),
      apiFetch('/dashboard/summary').then((r) => r.json())
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
                <div className="flex items-center gap-4">
                  <p className="text-[#5DA9FF] text-sm font-mono">{s.start_time} – {s.end_time}</p>
                  <button onClick={() => openMarkAttendance(s)} className="text-[#4ADE80] text-sm hover:text-white transition-colors">Mark Attendance</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {marking && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
              <h2 className="text-white font-bold text-lg mb-1">Mark Attendance</h2>
              <p className="text-[#90A6BD] text-sm mb-4">{marking.subject_name} · {marking.batch_code} · Today</p>
              {markError && <p className="text-[#F87171] text-sm mb-3">{markError}</p>}
              {studentsLoading ? (
                <p className="text-[#90A6BD] text-sm">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-[#90A6BD] text-sm">No students found for this batch.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {students.map((s) => (
                    <div key={s.student_id} className="flex items-center justify-between bg-[#0D1727] rounded-lg px-3 py-2">
                      <p className="text-white text-sm">{s.roll_number} — {s.first_name} {s.last_name}</p>
                      <select value={statuses[s.student_id] || 'PRESENT'}
                        onChange={(e) => setStatuses(p => ({ ...p, [s.student_id]: e.target.value }))}
                        className="bg-[#1A2436] border border-[#2F4E73] rounded-lg px-2 py-1 text-white text-xs">
                        {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setMarking(null)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleSubmitAttendance} disabled={submitting || students.length === 0}
                  className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                  {submitting ? 'Saving...' : `Save (${students.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

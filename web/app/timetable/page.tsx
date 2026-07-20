'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin } from '../../lib/auth'

// ─── Permanent timetable types ────────────────────────────────────────────────
interface TimetableEntry {
  timetable_id: string
  batch_id: string
  batch_code: string
  academic_year: string
  program: string
  faculty_name: string
  subject_name: string
  room_id: string
  room: string
  day: string
  lecture_number: number
  start_time: string
  end_time: string
}

// ─── Extra period types ───────────────────────────────────────────────────────
interface ExtraPeriod {
  extra_period_id: string
  faculty_id: string
  faculty_name: string
  batch_id: string
  batch_code: string
  subject_id: string
  subject_code: string
  subject_name: string
  room: string
  room_id: string
  week_start_date: string
  week_end_date: string
  day_of_week: string
  lecture_number: number
  start_time: string
  end_time: string
  attendance_window_minutes: number
}

// ─── Shared reference types ───────────────────────────────────────────────────
interface Batch   { batch_id: string; batch_code: string; program_id: string; program_name: string; academic_year: string; semester: number }
interface Program { program_id: string; program_name: string }
interface Faculty { faculty_id: string; first_name: string; last_name: string }
interface Subject { subject_id: string; subject_code: string; subject_name: string }
interface Room    { room_id: string; room_number: string }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const inputCls = "bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"

/** Returns the Monday of the ISO week that contains dateStr (UTC). */
function mondayOf(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" → "DD Mon YYYY" */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
}

export default function TimetablePage() {
  const router    = useRouter()
  const [isFaculty, setIsFaculty] = useState(false)
  const [isAdmin,   setIsAdmin]   = useState(false)

  // ─── View toggle: permanent timetable vs extra periods ──────────────────────

  // ─── Shared reference data (loaded once, used by both views) ────────────────
  const [batches,  setBatches]  = useState<Batch[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [faculty,  setFaculty]  = useState<Faculty[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms,    setRooms]    = useState<Room[]>([])

  // Active day tab — shared by both views
  const [activeDay, setActiveDay] = useState(DAYS[0])

  // ─── Permanent timetable state ───────────────────────────────────────────────
  const [entries,     setEntries]     = useState<TimetableEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filters,     setFilters]     = useState({ academic_year: '', program_id: '', semester: '', batch_id: '', room_id: '' })
  const [showModal,   setShowModal]   = useState(false)
  const [error,       setError]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [form, setForm] = useState({
    batchId: '', facultyId: '', subjectId: '', roomId: '', dayOfWeek: DAYS[0],
    lectureNumber: '1', startTime: '09:00', endTime: '10:00',
    attendanceWindowMinutes: '15',
    effectiveFrom: new Date().toISOString().slice(0, 10)
  })
  const [editModal,      setEditModal]      = useState(false)
  const [editEntry,      setEditEntry]      = useState<TimetableEntry | null>(null)
  const [editForm,       setEditForm]       = useState({
    facultyId: '', subjectId: '', roomId: '', dayOfWeek: '',
    lectureNumber: '1', startTime: '', endTime: '', attendanceWindowMinutes: '15'
  })
  const [editError,      setEditError]      = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ─── Extra period state ───────────────────────────────────────────────────────
  const [extraEntries,    setExtraEntries]    = useState<ExtraPeriod[]>([])
  const [extraFilterWeek, setExtraFilterWeek] = useState(new Date().toISOString().slice(0, 10))

  const [showExtraModal,   setShowExtraModal]   = useState(false)
  const [extraError,       setExtraError]       = useState('')
  const [extraSubmitting,  setExtraSubmitting]  = useState(false)
  const [extraForm, setExtraForm] = useState({
    facultyId: '', batchId: '', subjectId: '', roomId: '',
    weekDate: new Date().toISOString().slice(0, 10),
    dayOfWeek: DAYS[0], lectureNumber: '1',
    startTime: '09:00', endTime: '10:00', attendanceWindowMinutes: '15'
  })

  const [editExtraModal,      setEditExtraModal]      = useState(false)
  const [editExtraEntry,      setEditExtraEntry]      = useState<ExtraPeriod | null>(null)
  const [editExtraForm,       setEditExtraForm]       = useState({
    facultyId: '', subjectId: '', roomId: '', weekDate: '',
    dayOfWeek: '', lectureNumber: '1', startTime: '', endTime: '',
    attendanceWindowMinutes: '15'
  })
  const [editExtraError,      setEditExtraError]      = useState('')
  const [editExtraSubmitting, setEditExtraSubmitting] = useState(false)

  // ─── Fetch: permanent timetable ──────────────────────────────────────────────
  const fetchTimetable = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.academic_year) params.set('academic_year', filters.academic_year)
      if (filters.program_id)    params.set('program_id',    filters.program_id)
      if (filters.semester)      params.set('semester',      filters.semester)
      if (filters.batch_id)      params.set('batch_id',      filters.batch_id)
      if (filters.room_id)       params.set('room_id',       filters.room_id)
      const res  = await apiFetch(`/timetable?${params}`)
      const json = await res.json()
      setEntries(json.data || [])
    } catch { setEntries([]) } finally { setLoading(false) }
  }, [filters])

  // ─── Fetch: extra periods ─────────────────────────────────────────────────────
  const fetchExtraPeriods = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('week_start_date', mondayOf(extraFilterWeek))
      const res  = await apiFetch(`/extra-periods?${params}`)
      const json = await res.json()
      setExtraEntries(json.data || [])
    } catch { setExtraEntries([]) }
  }, [extraFilterWeek])

  // ─── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    const a = getAdmin()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFaculty(a?.role === 'FACULTY')
    setIsAdmin(a?.role === 'SUPER_ADMIN' || a?.role === 'ADMIN')
    apiFetch('/batches').then(r => r.json()).then(j => setBatches(j.data || [])).catch(() => {})
    apiFetch('/programs').then(r => r.json()).then(j => setPrograms(j.data || [])).catch(() => {})
    apiFetch('/faculty').then(r => r.json()).then(j => setFaculty(j.data || [])).catch(() => {})
    apiFetch('/subjects').then(r => r.json()).then(j => setSubjects(j.data || [])).catch(() => {})
    apiFetch('/rooms').then(r => r.json()).then(j => setRooms(j.data || [])).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTimetable() },    [fetchTimetable])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchExtraPeriods() }, [fetchExtraPeriods])

  // ─── Derived: permanent timetable ────────────────────────────────────────────
  const academicYears = useMemo(
    () => Array.from(new Set(batches.map(b => b.academic_year))).sort().reverse(),
    [batches]
  )
  const semesters = useMemo(() => Array.from(new Set(
    batches.filter(b =>
      (!filters.academic_year || b.academic_year === filters.academic_year) &&
      (!filters.program_id    || b.program_id    === filters.program_id)
    ).map(b => b.semester)
  )).sort((a, b) => a - b), [batches, filters.academic_year, filters.program_id])

  const filteredBatchOptions = useMemo(() => batches.filter(b =>
    (!filters.academic_year || b.academic_year === filters.academic_year) &&
    (!filters.program_id    || b.program_id    === filters.program_id) &&
    (!filters.semester      || String(b.semester) === filters.semester)
  ), [batches, filters])

  const dayEntries = useMemo(() => {
    const permanent = entries
      .filter(e => e.day?.toLowerCase() === activeDay.toLowerCase())
      .map(entry => ({ entry, isExtra: false as const }))
    const extras = extraEntries
      .filter(e => e.day_of_week?.toLowerCase() === activeDay.toLowerCase())
      .filter(e => !filters.batch_id || e.batch_id === filters.batch_id)
      .filter(e => !filters.room_id || e.room_id === filters.room_id)
      .map(entry => ({ entry, isExtra: true as const }))

    return [...permanent, ...extras].sort((a, b) => {
      const timeDiff = a.entry.start_time.localeCompare(b.entry.start_time)
      if (timeDiff !== 0) return timeDiff
      return a.entry.lecture_number - b.entry.lecture_number
    })
  }, [entries, extraEntries, activeDay, filters.batch_id, filters.room_id])



  // ─── Derived: extra periods ───────────────────────────────────────────────────

  // ─── Handlers: permanent timetable ───────────────────────────────────────────
  const handleCreate = async () => {
    setError('')
    const lectureTaken = entries.find(e =>
      e.batch_id === form.batchId &&
      e.day?.toLowerCase() === form.dayOfWeek.toLowerCase() &&
      e.lecture_number === Number(form.lectureNumber)
    )
    if (lectureTaken) {
      setError(`This batch already has lecture ${form.lectureNumber} on ${form.dayOfWeek} (${lectureTaken.subject_name}, ${lectureTaken.start_time}–${lectureTaken.end_time}) — pick a different lecture number.`)
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch('/timetable', {
        method: 'POST',
        body: JSON.stringify({
          batch_id: form.batchId, faculty_id: form.facultyId, subject_id: form.subjectId,
          room_id: form.roomId, day_of_week: form.dayOfWeek,
          lecture_number: Number(form.lectureNumber),
          start_time: form.startTime, end_time: form.endTime,
          attendance_window_minutes: Number(form.attendanceWindowMinutes),
          effective_from: form.effectiveFrom
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create period'); return }
      setShowModal(false)
      fetchTimetable()
    } catch { setError('Network error — is the API server running?') } finally { setSubmitting(false) }
  }

  const openEdit = (e: TimetableEntry) => {
    setEditEntry(e)
    setEditForm({
      facultyId: '', subjectId: '', roomId: e.room_id, dayOfWeek: e.day,
      lectureNumber: String(e.lecture_number),
      startTime: e.start_time.slice(0, 5), endTime: e.end_time.slice(0, 5),
      attendanceWindowMinutes: '15'
    })
    setEditError('')
    setEditModal(true)
  }

  const handleEdit = async () => {
    if (!editEntry) return
    setEditError(''); setEditSubmitting(true)
    try {
      const res = await apiFetch(`/timetable/${editEntry.timetable_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          faculty_id: editForm.facultyId  || undefined,
          subject_id: editForm.subjectId  || undefined,
          room_id:    editForm.roomId     || undefined,
          day_of_week: editForm.dayOfWeek,
          lecture_number: Number(editForm.lectureNumber),
          start_time: editForm.startTime, end_time: editForm.endTime,
          attendance_window_minutes: Number(editForm.attendanceWindowMinutes)
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setEditError(json.message || 'Failed to update'); return }
      setEditModal(false)
      fetchTimetable()
    } catch { setEditError('Network error') } finally { setEditSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this period from the timetable?')) return
    await apiFetch(`/timetable/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchTimetable()
  }

  // ─── Handlers: extra periods ──────────────────────────────────────────────────
  const handleCreateExtra = async () => {
    setExtraError('')
    if (!extraForm.batchId)   { setExtraError('Batch is required');   return }
    if (!extraForm.subjectId) { setExtraError('Subject is required'); return }
    if (!extraForm.roomId)    { setExtraError('Room is required');    return }
    if (!isFaculty && !extraForm.facultyId) { setExtraError('Faculty is required'); return }

    setExtraSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        batch_id:    extraForm.batchId,
        subject_id:  extraForm.subjectId,
        room_id:     extraForm.roomId,
        week_start_date: mondayOf(extraForm.weekDate),
        day_of_week: extraForm.dayOfWeek,
        lecture_number: Number(extraForm.lectureNumber),
        start_time:  extraForm.startTime,
        end_time:    extraForm.endTime,
        attendance_window_minutes: Number(extraForm.attendanceWindowMinutes)
      }
      if (!isFaculty) body.faculty_id = extraForm.facultyId
      const res  = await apiFetch('/extra-periods', { method: 'POST', body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok || !json.success) { setExtraError(json.message || 'Failed to create extra period'); return }
      setShowExtraModal(false)
      fetchExtraPeriods()
    } catch { setExtraError('Network error — is the API server running?') } finally { setExtraSubmitting(false) }
  }

  const openEditExtra = (e: ExtraPeriod) => {
    setEditExtraEntry(e)
    setEditExtraForm({
      facultyId: '', subjectId: '', roomId: e.room_id,
      weekDate: e.week_start_date, dayOfWeek: e.day_of_week,
      lectureNumber: String(e.lecture_number),
      startTime: e.start_time.slice(0, 5), endTime: e.end_time.slice(0, 5),
      attendanceWindowMinutes: String(e.attendance_window_minutes)
    })
    setEditExtraError('')
    setEditExtraModal(true)
  }

  const handleEditExtra = async () => {
    if (!editExtraEntry) return
    setEditExtraError(''); setEditExtraSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        week_start_date: mondayOf(editExtraForm.weekDate),
        day_of_week: editExtraForm.dayOfWeek,
        lecture_number: Number(editExtraForm.lectureNumber),
        start_time:  editExtraForm.startTime,
        end_time:    editExtraForm.endTime,
        attendance_window_minutes: Number(editExtraForm.attendanceWindowMinutes)
      }
      if (editExtraForm.roomId)                       body.room_id    = editExtraForm.roomId
      if (editExtraForm.subjectId)                    body.subject_id = editExtraForm.subjectId
      if (isAdmin && editExtraForm.facultyId)         body.faculty_id = editExtraForm.facultyId
      const res  = await apiFetch(`/extra-periods/${editExtraEntry.extra_period_id}`, {
        method: 'PUT', body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setEditExtraError(json.message || 'Failed to update'); return }
      setEditExtraModal(false)
      fetchExtraPeriods()
    } catch { setEditExtraError('Network error') } finally { setEditExtraSubmitting(false) }
  }

  const handleDeleteExtra = async (id: string) => {
    if (!confirm('Remove this extra period?')) return
    await apiFetch(`/extra-periods/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchExtraPeriods()
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header — unchanged from original */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</Link>
          <h1 className="text-2xl font-bold">Timetable</h1>
        </div>

        {/* View toggle — matches the master-data tab pattern exactly */}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PERMANENT TIMETABLE VIEW                                            */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select value={filters.academic_year} onChange={(e) => setFilters({ ...filters, academic_year: e.target.value, program_id: '', semester: '', batch_id: '' })} className={inputCls}>
                <option value="">All Academic Years</option>
                {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filters.program_id} onChange={(e) => setFilters(p => ({ ...p, program_id: e.target.value, semester: '', batch_id: '' }))} className={inputCls}>
                <option value="">All Programs</option>
                {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
              </select>
              <select value={filters.semester} onChange={(e) => setFilters(p => ({ ...p, semester: e.target.value, batch_id: '' }))} className={inputCls}>
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <select value={filters.batch_id} onChange={(e) => setFilters(p => ({ ...p, batch_id: e.target.value }))} className={inputCls}>
                <option value="">All Batches</option>
                {filteredBatchOptions.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_code}</option>)}
              </select>
              <select value={filters.room_id} onChange={(e) => setFilters(p => ({ ...p, room_id: e.target.value }))} className={inputCls}>
                <option value="">All Rooms</option>
                {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
              </select>
              <div>
                <label className="text-[#90A6BD] text-xs mb-1 block">Week</label>
                <input type="date" value={extraFilterWeek}
                  onChange={e => setExtraFilterWeek(e.target.value)}
                  className={inputCls}
                  title="Extra periods for the selected week" />
              </div>
              {(filters.academic_year || filters.program_id || filters.semester || filters.batch_id || filters.room_id) && (
                <button onClick={() => setFilters({ academic_year: '', program_id: '', semester: '', batch_id: '', room_id: '' })} className="text-[#F87171] text-sm px-2">Clear</button>
              )}
            </div>

            {/* Day tabs + Add button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                {DAYS.map((day) => (
                  <button key={day} onClick={() => setActiveDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${activeDay === day ? 'bg-[#5DA9FF] text-white' : 'bg-[#1A2436] text-[#90A6BD] border border-[#2F4E73]'}`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setForm(f => ({ ...f, dayOfWeek: activeDay })); setShowModal(true) }}
                  className="bg-[#5DA9FF] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90">
                  + Add Period
                </button>
                <button onClick={() => { setExtraForm(f => ({ ...f, dayOfWeek: activeDay, weekDate: extraFilterWeek })); setExtraError(''); setShowExtraModal(true) }}
                  className="bg-[#F59E0B] text-[#0D1727] font-bold px-6 py-3 rounded-xl hover:opacity-90">
                  + Add Extra Period
                </button>
              </div>
            </div>

            {/* Entry list */}
            {loading ? (
              <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
            ) : dayEntries.length === 0 ? (
              <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
                <p className="text-[#90A6BD] font-bold">No periods for {activeDay}</p>
                <button onClick={() => { setForm(f => ({ ...f, dayOfWeek: activeDay })); setShowModal(true) }}
                  className="mt-4 bg-[#5DA9FF] text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 text-sm">
                  + Add Period
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dayEntries.map(({ entry: e, isExtra }) => (
                  <div key={isExtra ? e.extra_period_id : e.timetable_id}
                    className={`bg-[#1A2436] rounded-2xl border p-5 flex justify-between items-center ${isExtra ? 'border-[#F59E0B] bg-[#2A1A00]/40' : 'border-[#2F4E73]'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold">{e.subject_name}</p>
                        {isExtra && (
                          <span className="bg-[#2A1A00] text-[#F59E0B] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#F59E0B]/30">
                            EXTRA PERIOD
                          </span>
                        )}
                      </div>
                      <p className="text-[#90A6BD] text-sm mt-1">{e.faculty_name} · {e.batch_code} · Room {e.room}</p>
                      <p className="text-[#4A6080] text-xs mt-1">
                        Lecture {e.lecture_number}
                        {isExtra && ` · Week of ${fmtDate((e as ExtraPeriod).week_start_date)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[#5DA9FF] text-sm font-mono">{e.start_time} – {e.end_time}</p>
                      <button onClick={() => isExtra ? openEditExtra(e) : openEdit(e)} className="text-[#F59E0B] text-sm hover:text-white transition-colors">Edit</button>
                      <button onClick={() => isExtra ? handleDeleteExtra(e.extra_period_id) : handleDelete(e.timetable_id)} className="text-[#F87171] text-sm hover:text-white transition-colors">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Period Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h2 className="text-white font-bold text-lg mb-4">Add Period</h2>
                  {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
                  <div className="flex flex-col gap-3">
                    <select value={form.batchId} onChange={(e) => setForm(p => ({ ...p, batchId: e.target.value }))} className={inputCls}>
                      <option value="">Batch…</option>
                      {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_code} ({b.academic_year}, Sem {b.semester})</option>)}
                    </select>
                    <select value={form.facultyId} onChange={(e) => setForm(p => ({ ...p, facultyId: e.target.value }))} className={inputCls}>
                      <option value="">Faculty…</option>
                      {faculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.first_name} {f.last_name}</option>)}
                    </select>
                    <select value={form.subjectId} onChange={(e) => setForm(p => ({ ...p, subjectId: e.target.value }))} className={inputCls}>
                      <option value="">Subject…</option>
                      {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} — {s.subject_name}</option>)}
                    </select>
                    <select value={form.roomId} onChange={(e) => setForm(p => ({ ...p, roomId: e.target.value }))} className={inputCls}>
                      <option value="">Room…</option>
                      {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
                    </select>
                    <select value={form.dayOfWeek} onChange={(e) => setForm(p => ({ ...p, dayOfWeek: e.target.value }))} className={inputCls}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Lecture #" type="number" value={form.lectureNumber}
                        onChange={(e) => setForm(p => ({ ...p, lectureNumber: e.target.value }))} className={inputCls} />
                      <input placeholder="Window (min)" type="number" value={form.attendanceWindowMinutes}
                        onChange={(e) => setForm(p => ({ ...p, attendanceWindowMinutes: e.target.value }))} className={inputCls} />
                      <input type="time" value={form.startTime}
                        onChange={(e) => setForm(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
                      <input type="time" value={form.endTime}
                        onChange={(e) => setForm(p => ({ ...p, endTime: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[#90A6BD] text-xs mb-1 block">Effective From</label>
                      <input type="date" value={form.effectiveFrom}
                        onChange={(e) => setForm(p => ({ ...p, effectiveFrom: e.target.value }))} className={`w-full ${inputCls}`} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setShowModal(false); setError('') }} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                    <button onClick={handleCreate} disabled={submitting || !form.batchId || !form.facultyId || !form.subjectId || !form.roomId}
                      className="flex-1 bg-[#5DA9FF] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                      {submitting ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Period Modal */}
            {editModal && editEntry && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h2 className="text-white font-bold text-lg mb-1">Edit Period</h2>
                  <p className="text-[#90A6BD] text-sm mb-4">{editEntry.subject_name} · {editEntry.batch_code}</p>
                  {editError && <p className="text-[#F87171] text-sm mb-3">{editError}</p>}
                  <div className="flex flex-col gap-3">
                    <select value={editForm.facultyId} onChange={(e) => setEditForm(p => ({ ...p, facultyId: e.target.value }))} className={inputCls}>
                      <option value="">Keep current faculty ({editEntry.faculty_name})</option>
                      {faculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.first_name} {f.last_name}</option>)}
                    </select>
                    <select value={editForm.subjectId} onChange={(e) => setEditForm(p => ({ ...p, subjectId: e.target.value }))} className={inputCls}>
                      <option value="">Keep current subject ({editEntry.subject_name})</option>
                      {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} — {s.subject_name}</option>)}
                    </select>
                    <select value={editForm.roomId} onChange={(e) => setEditForm(p => ({ ...p, roomId: e.target.value }))} className={inputCls}>
                      <option value="">Keep current room ({editEntry.room})</option>
                      {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
                    </select>
                    <select value={editForm.dayOfWeek} onChange={(e) => setEditForm(p => ({ ...p, dayOfWeek: e.target.value }))} className={inputCls}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Lecture #" type="number" value={editForm.lectureNumber}
                        onChange={(e) => setEditForm(p => ({ ...p, lectureNumber: e.target.value }))} className={inputCls} />
                      <input placeholder="Window (min)" type="number" value={editForm.attendanceWindowMinutes}
                        onChange={(e) => setEditForm(p => ({ ...p, attendanceWindowMinutes: e.target.value }))} className={inputCls} />
                      <input type="time" value={editForm.startTime}
                        onChange={(e) => setEditForm(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
                      <input type="time" value={editForm.endTime}
                        onChange={(e) => setEditForm(p => ({ ...p, endTime: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setEditModal(false); setEditError('') }} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                    <button onClick={handleEdit} disabled={editSubmitting}
                      className="flex-1 bg-[#F59E0B] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                      {editSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* EXTRA PERIODS VIEW                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <>
          <>
            {/* Add Extra Period Modal */}
            {showExtraModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h2 className="text-white font-bold text-lg mb-1">Add Extra Period</h2>
                  <p className="text-[#90A6BD] text-xs mb-4">Active for one week only — pick any date in the target week.</p>
                  {extraError && <p className="text-[#F87171] text-sm mb-3">{extraError}</p>}
                  <div className="flex flex-col gap-3">
                    {!isFaculty && (
                      <select value={extraForm.facultyId}
                        onChange={e => setExtraForm(p => ({ ...p, facultyId: e.target.value }))} className={inputCls}>
                        <option value="">Faculty…</option>
                        {faculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.first_name} {f.last_name}</option>)}
                      </select>
                    )}
                    <select value={extraForm.batchId}
                      onChange={e => setExtraForm(p => ({ ...p, batchId: e.target.value }))} className={inputCls}>
                      <option value="">Batch…</option>
                      {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_code} ({b.academic_year}, Sem {b.semester})</option>)}
                    </select>
                    <select value={extraForm.subjectId}
                      onChange={e => setExtraForm(p => ({ ...p, subjectId: e.target.value }))} className={inputCls}>
                      <option value="">Subject…</option>
                      {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} — {s.subject_name}</option>)}
                    </select>
                    <select value={extraForm.roomId}
                      onChange={e => setExtraForm(p => ({ ...p, roomId: e.target.value }))} className={inputCls}>
                      <option value="">Room…</option>
                      {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
                    </select>
                    <div>
                      <label className="text-[#90A6BD] text-xs mb-1 block">Week (any date in the target week)</label>
                      <input type="date" value={extraForm.weekDate}
                        onChange={e => setExtraForm(p => ({ ...p, weekDate: e.target.value }))}
                        className={`w-full ${inputCls}`} />
                    </div>
                    <select value={extraForm.dayOfWeek}
                      onChange={e => setExtraForm(p => ({ ...p, dayOfWeek: e.target.value }))} className={inputCls}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Lecture #" type="number" min="1" value={extraForm.lectureNumber}
                        onChange={e => setExtraForm(p => ({ ...p, lectureNumber: e.target.value }))} className={inputCls} />
                      <input placeholder="Window (min)" type="number" min="1" max="60" value={extraForm.attendanceWindowMinutes}
                        onChange={e => setExtraForm(p => ({ ...p, attendanceWindowMinutes: e.target.value }))} className={inputCls} />
                      <input type="time" value={extraForm.startTime}
                        onChange={e => setExtraForm(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
                      <input type="time" value={extraForm.endTime}
                        onChange={e => setExtraForm(p => ({ ...p, endTime: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setShowExtraModal(false); setExtraError('') }}
                      className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                    <button onClick={handleCreateExtra}
                      disabled={extraSubmitting || !extraForm.batchId || !extraForm.subjectId || !extraForm.roomId || (!isFaculty && !extraForm.facultyId)}
                      className="flex-1 bg-[#F59E0B] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                      {extraSubmitting ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Extra Period Modal */}
            {editExtraModal && editExtraEntry && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h2 className="text-white font-bold text-lg mb-1">Edit Extra Period</h2>
                  <p className="text-[#90A6BD] text-sm mb-4">
                    {editExtraEntry.subject_name} · {editExtraEntry.batch_code} · Week of {fmtDate(editExtraEntry.week_start_date)}
                  </p>
                  {editExtraError && <p className="text-[#F87171] text-sm mb-3">{editExtraError}</p>}
                  <div className="flex flex-col gap-3">
                    {isAdmin && (
                      <select value={editExtraForm.facultyId}
                        onChange={e => setEditExtraForm(p => ({ ...p, facultyId: e.target.value }))} className={inputCls}>
                        <option value="">Keep current faculty ({editExtraEntry.faculty_name})</option>
                        {faculty.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.first_name} {f.last_name}</option>)}
                      </select>
                    )}
                    <select value={editExtraForm.subjectId}
                      onChange={e => setEditExtraForm(p => ({ ...p, subjectId: e.target.value }))} className={inputCls}>
                      <option value="">Keep current subject ({editExtraEntry.subject_name})</option>
                      {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_code} — {s.subject_name}</option>)}
                    </select>
                    <select value={editExtraForm.roomId}
                      onChange={e => setEditExtraForm(p => ({ ...p, roomId: e.target.value }))} className={inputCls}>
                      <option value="">Keep current room ({editExtraEntry.room})</option>
                      {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
                    </select>
                    <div>
                      <label className="text-[#90A6BD] text-xs mb-1 block">Week (any date in the target week)</label>
                      <input type="date" value={editExtraForm.weekDate}
                        onChange={e => setEditExtraForm(p => ({ ...p, weekDate: e.target.value }))}
                        className={`w-full ${inputCls}`} />
                    </div>
                    <select value={editExtraForm.dayOfWeek}
                      onChange={e => setEditExtraForm(p => ({ ...p, dayOfWeek: e.target.value }))} className={inputCls}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Lecture #" type="number" min="1" value={editExtraForm.lectureNumber}
                        onChange={e => setEditExtraForm(p => ({ ...p, lectureNumber: e.target.value }))} className={inputCls} />
                      <input placeholder="Window (min)" type="number" min="1" max="60" value={editExtraForm.attendanceWindowMinutes}
                        onChange={e => setEditExtraForm(p => ({ ...p, attendanceWindowMinutes: e.target.value }))} className={inputCls} />
                      <input type="time" value={editExtraForm.startTime}
                        onChange={e => setEditExtraForm(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
                      <input type="time" value={editExtraForm.endTime}
                        onChange={e => setEditExtraForm(p => ({ ...p, endTime: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setEditExtraModal(false); setEditExtraError('') }}
                      className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                    <button onClick={handleEditExtra} disabled={editExtraSubmitting}
                      className="flex-1 bg-[#F59E0B] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                      {editExtraSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        </>

      </div>
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

type Tab = 'departments' | 'subjects' | 'calendar'

const PROGRAMS = ['B.Tech', 'M.Tech', 'PhD', 'MBA', 'MCA']
const SUBJECT_TYPES = ['Theory', 'Lab', 'Tutorial']
const COURSE_CATEGORIES = ['Core', 'Elective', 'Open Elective']
const EVENT_TYPES = ['WORKING_DAY', 'HOLIDAY', 'EXAM', 'VACATION', 'EVENT']

export default function MasterDataPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('departments')

  useEffect(() => {
    if (!isLoggedIn()) router.push('/login')
  }, [])

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Master Data</h1>
        </div>
        <div className="flex gap-2 mb-6 border-b border-[#2F4E73]">
          {(['departments', 'subjects', 'calendar'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'text-[#4ADE80] border-b-2 border-[#4ADE80]' : 'text-[#90A6BD]'}`}>
              {t === 'calendar' ? 'Academic Calendar' : t}
            </button>
          ))}
        </div>
        {tab === 'departments' && <DepartmentsTab />}
        {tab === 'subjects' && <SubjectsTab />}
        {tab === 'calendar' && <CalendarTab />}
      </div>
    </main>
  )
}

function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold text-lg mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

const inputCls = "bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"

function DepartmentsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ department_code: '', department_name: '', hod_name: '', email: '', phone: '' })

  const fetchItems = async () => {
    setLoading(true)
    try { const res = await apiFetch('/departments'); const json = await res.json(); setItems(json.data || []) }
    catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [])

  const handleCreate = async () => {
    setError('')
    try {
      const res = await apiFetch('/departments', { method: 'POST', body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create'); return }
      setShowModal(false)
      setForm({ department_code: '', department_name: '', hod_name: '', email: '', phone: '' })
      fetchItems()
    } catch { setError('Network error') }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm">+ New Department</button>
      </div>
      {loading ? <p className="text-[#90A6BD]">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((d) => (
            <div key={d.department_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
              <p className="text-white font-bold">{d.department_code} — {d.department_name}</p>
              <p className="text-[#90A6BD] text-sm mt-1">HOD: {d.hod_name || '—'}</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title="New Department" onClose={() => setShowModal(false)}>
          {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
          <div className="flex flex-col gap-3">
            <input placeholder="Department Code" value={form.department_code} onChange={(e) => setForm(p => ({ ...p, department_code: e.target.value }))} className={inputCls} />
            <input placeholder="Department Name" value={form.department_name} onChange={(e) => setForm(p => ({ ...p, department_name: e.target.value }))} className={inputCls} />
            <input placeholder="HOD Name (optional)" value={form.hod_name} onChange={(e) => setForm(p => ({ ...p, hod_name: e.target.value }))} className={inputCls} />
            <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm">Create</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SubjectsTab() {
  const [items, setItems] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ program: '', semester: '' })
  const [form, setForm] = useState({
    department_id: '', subject_code: '', subject_name: '', program: PROGRAMS[0],
    semester: '1', credits: '4', subject_type: SUBJECT_TYPES[0],
    course_category: COURSE_CATEGORIES[0], contact_hours_per_week: '4'
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.program) params.set('program', filters.program)
      if (filters.semester) params.set('semester', filters.semester)
      const res = await apiFetch(`/subjects?${params}`); const json = await res.json(); setItems(json.data || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [filters])
  useEffect(() => { apiFetch('/departments').then(r => r.json()).then(j => setDepartments(j.data || [])).catch(() => {}) }, [])

  const handleCreate = async () => {
    setError('')
    try {
      const res = await apiFetch('/subjects', { method: 'POST', body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create'); return }
      setShowModal(false)
      fetchItems()
    } catch { setError('Network error') }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="flex gap-3">
          <select value={filters.program} onChange={(e) => setFilters(p => ({ ...p, program: e.target.value }))} className={inputCls}>
            <option value="">All Programs</option>
            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.semester} onChange={(e) => setFilters(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm">+ New Subject</button>
      </div>
      {loading ? <p className="text-[#90A6BD]">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <div key={s.subject_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
              <p className="text-white font-bold">{s.subject_code} — {s.subject_name}</p>
              <p className="text-[#90A6BD] text-sm mt-1">{s.program} · Sem {s.semester} · {s.subject_type} · {s.credits} credits</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title="New Subject" onClose={() => setShowModal(false)}>
          {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className={`col-span-2 ${inputCls}`}>
              <option value="">Department…</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
            <input placeholder="Subject Code" value={form.subject_code} onChange={(e) => setForm(p => ({ ...p, subject_code: e.target.value }))} className={inputCls} />
            <input placeholder="Subject Name" value={form.subject_name} onChange={(e) => setForm(p => ({ ...p, subject_name: e.target.value }))} className={inputCls} />
            <select value={form.program} onChange={(e) => setForm(p => ({ ...p, program: e.target.value }))} className={inputCls}>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={form.semester} onChange={(e) => setForm(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <select value={form.subject_type} onChange={(e) => setForm(p => ({ ...p, subject_type: e.target.value }))} className={inputCls}>
              {SUBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.course_category} onChange={(e) => setForm(p => ({ ...p, course_category: e.target.value }))} className={inputCls}>
              {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Credits" type="number" value={form.credits} onChange={(e) => setForm(p => ({ ...p, credits: e.target.value }))} className={inputCls} />
            <input placeholder="Contact Hrs/Week" type="number" value={form.contact_hours_per_week} onChange={(e) => setForm(p => ({ ...p, contact_hours_per_week: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm">Create</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function CalendarTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    calendar_date: '', academic_year: '', semester: '1', is_working_day: true,
    event_type: EVENT_TYPES[0], event_name: ''
  })

  const fetchItems = async () => {
    setLoading(true)
    try { const res = await apiFetch('/academic-calendar'); const json = await res.json(); setItems(json.data || []) }
    catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [])

  const handleCreate = async () => {
    setError('')
    try {
      const res = await apiFetch('/academic-calendar', { method: 'POST', body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create'); return }
      setShowModal(false)
      fetchItems()
    } catch { setError('Network error') }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm">+ New Entry</button>
      </div>
      {loading ? <p className="text-[#90A6BD]">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <div key={c.calendar_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
              <p className="text-white font-bold">{new Date(c.calendar_date).toLocaleDateString()} — {c.event_type}</p>
              <p className="text-[#90A6BD] text-sm mt-1">{c.event_name || (c.is_working_day ? 'Working day' : 'Non-working day')} · AY {c.academic_year}, Sem {c.semester}</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title="New Calendar Entry" onClose={() => setShowModal(false)}>
          {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
          <div className="flex flex-col gap-3">
            <input type="date" value={form.calendar_date} onChange={(e) => setForm(p => ({ ...p, calendar_date: e.target.value }))} className={inputCls} />
            <input placeholder="Academic Year (e.g. 2026-27)" value={form.academic_year} onChange={(e) => setForm(p => ({ ...p, academic_year: e.target.value }))} className={inputCls} />
            <select value={form.semester} onChange={(e) => setForm(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <select value={form.event_type} onChange={(e) => setForm(p => ({ ...p, event_type: e.target.value, is_working_day: e.target.value === 'WORKING_DAY' }))} className={inputCls}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Event Name (optional)" value={form.event_name} onChange={(e) => setForm(p => ({ ...p, event_name: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm">Create</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

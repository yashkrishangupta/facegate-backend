'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin } from '../../lib/auth'

type Tab = 'departments' | 'programs' | 'batches' | 'subjects' | 'faculty' | 'calendar'

const DEGREE_TYPES = ['UG', 'PG', 'Doctoral']
const SUBJECT_TYPES = ['Theory', 'Lab', 'Tutorial']
const COURSE_CATEGORIES = ['Core', 'Elective', 'Open Elective']
const EVENT_TYPES = ['WORKING_DAY', 'HOLIDAY', 'EXAM', 'VACATION', 'EVENT']
const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD']

const TAB_LABELS: Record<Tab, string> = {
  departments: 'Departments', programs: 'Programs', batches: 'Batches',
  subjects: 'Subjects', faculty: 'Faculty', calendar: 'Academic Calendar'
}

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
        <div className="flex gap-2 mb-6 border-b border-[#2F4E73] overflow-x-auto">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${tab === t ? 'text-[#4ADE80] border-b-2 border-[#4ADE80]' : 'text-[#90A6BD]'}`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
        {tab === 'departments' && <DepartmentsTab />}
        {tab === 'programs' && <ProgramsTab />}
        {tab === 'batches' && <BatchesTab />}
        {tab === 'subjects' && <SubjectsTab />}
        {tab === 'faculty' && <FacultyTab />}
        {tab === 'calendar' && <CalendarTab />}
      </div>
    </main>
  )
}

function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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

function ProgramsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ program_code: '', program_name: '', degree_type: DEGREE_TYPES[0], duration_years: '4' })

  const fetchItems = async () => {
    setLoading(true)
    try { const res = await apiFetch('/programs'); const json = await res.json(); setItems(json.data || []) }
    catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [])

  const handleCreate = async () => {
    setError('')
    try {
      const res = await apiFetch('/programs', {
        method: 'POST',
        body: JSON.stringify({ ...form, duration_years: Number(form.duration_years) })
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create'); return }
      setShowModal(false)
      setForm({ program_code: '', program_name: '', degree_type: DEGREE_TYPES[0], duration_years: '4' })
      fetchItems()
    } catch { setError('Network error') }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#90A6BD] text-sm">Programs (B.Tech, M.Tech, etc.) that batches and subjects belong to.</p>
        <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm whitespace-nowrap">+ New Program</button>
      </div>
      {loading ? <p className="text-[#90A6BD]">Loading...</p> : items.length === 0 ? (
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-8 text-center text-[#90A6BD]">No programs yet — create one before adding batches or subjects.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p.program_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
              <p className="text-white font-bold">{p.program_code} — {p.program_name}</p>
              <p className="text-[#90A6BD] text-sm mt-1">{p.degree_type} · {p.duration_years} years</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title="New Program" onClose={() => setShowModal(false)}>
          {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
          <div className="flex flex-col gap-3">
            <input placeholder="Program Code (e.g. BTECH-CSE)" value={form.program_code} onChange={(e) => setForm(p => ({ ...p, program_code: e.target.value }))} className={inputCls} />
            <input placeholder="Program Name (e.g. B.Tech Computer Science)" value={form.program_name} onChange={(e) => setForm(p => ({ ...p, program_name: e.target.value }))} className={inputCls} />
            <select value={form.degree_type} onChange={(e) => setForm(p => ({ ...p, degree_type: e.target.value }))} className={inputCls}>
              {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input placeholder="Duration (years)" type="number" value={form.duration_years} onChange={(e) => setForm(p => ({ ...p, duration_years: e.target.value }))} className={inputCls} />
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

function BatchesTab() {
  const [items, setItems] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ academic_year: '', program_id: '', semester: '', department_id: '' })
  const [form, setForm] = useState({
    department_id: '', batch_code: '', program_id: '', academic_year: '',
    semester: '1', section: '', strength: '60', batch_advisor_id: ''
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await apiFetch(`/batches?${params}`); const json = await res.json(); setItems(json.data || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [filters])
  useEffect(() => {
    apiFetch('/departments').then(r => r.json()).then(j => setDepartments(j.data || [])).catch(() => {})
    apiFetch('/programs').then(r => r.json()).then(j => setPrograms(j.data || [])).catch(() => {})
    apiFetch('/faculty').then(r => r.json()).then(j => setFaculty(j.data || [])).catch(() => {})
  }, [])

  const handleCreate = async () => {
    setError('')
    try {
      const res = await apiFetch('/batches', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          semester: Number(form.semester),
          strength: Number(form.strength),
          batch_advisor_id: form.batch_advisor_id || undefined
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create'); return }
      setShowModal(false)
      fetchItems()
    } catch { setError('Network error') }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filters.academic_year} onChange={(e) => setFilters(p => ({ ...p, academic_year: e.target.value }))} className={inputCls}>
          <option value="">All Academic Years</option>
          {Array.from(new Set(items.map(b => b.academic_year))).sort().reverse().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.program_id} onChange={(e) => setFilters(p => ({ ...p, program_id: e.target.value }))} className={inputCls}>
          <option value="">All Programs</option>
          {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
        </select>
        <select value={filters.semester} onChange={(e) => setFilters(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={filters.department_id} onChange={(e) => setFilters(p => ({ ...p, department_id: e.target.value }))} className={inputCls}>
          <option value="">All Departments</option>
          {departments.map((d: any) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
        </select>
        {(filters.academic_year || filters.program_id || filters.semester || filters.department_id) && (
          <button onClick={() => setFilters({ academic_year: '', program_id: '', semester: '', department_id: '' })} className="text-[#F87171] text-sm px-2">Clear</button>
        )}
      </div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#90A6BD] text-sm">A batch is what students and timetable periods attach to.</p>
        <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm whitespace-nowrap">+ New Batch</button>
      </div>
      {loading ? <p className="text-[#90A6BD]">Loading...</p> : items.length === 0 ? (
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-8 text-center text-[#90A6BD]">No batches match these filters</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((b) => (
            <div key={b.batch_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
              <p className="text-white font-bold">{b.batch_code}</p>
              <p className="text-[#90A6BD] text-sm mt-1">{b.program_name} · {b.academic_year} · Sem {b.semester}{b.section ? ` · Sec ${b.section}` : ''}</p>
              <p className="text-[#4A6080] text-xs mt-1">{b.department_name}{b.advisor_name ? ` · Advisor: ${b.advisor_name}` : ''}</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title="New Batch" onClose={() => setShowModal(false)}>
          {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
          {programs.length === 0 && <p className="text-[#F59E0B] text-xs mb-3">No programs exist yet — create one on the Programs tab first.</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className={`col-span-2 ${inputCls}`}>
              <option value="">Department…</option>
              {departments.map((d: any) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
            <input placeholder="Batch Code (e.g. CS-2024-A)" value={form.batch_code} onChange={(e) => setForm(p => ({ ...p, batch_code: e.target.value }))} className={`col-span-2 ${inputCls}`} />
            <select value={form.program_id} onChange={(e) => setForm(p => ({ ...p, program_id: e.target.value }))} className={inputCls}>
              <option value="">Program…</option>
              {programs.map((p: any) => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
            </select>
            <input placeholder="Academic Year (e.g. 2026-27)" value={form.academic_year} onChange={(e) => setForm(p => ({ ...p, academic_year: e.target.value }))} className={inputCls} />
            <select value={form.semester} onChange={(e) => setForm(p => ({ ...p, semester: e.target.value }))} className={inputCls}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <input placeholder="Section" value={form.section} onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))} className={inputCls} />
            <input placeholder="Strength" type="number" value={form.strength} onChange={(e) => setForm(p => ({ ...p, strength: e.target.value }))} className={inputCls} />
            <select value={form.batch_advisor_id} onChange={(e) => setForm(p => ({ ...p, batch_advisor_id: e.target.value }))} className={inputCls}>
              <option value="">Advisor (optional)…</option>
              {faculty.map((f: any) => <option key={f.faculty_id} value={f.faculty_id}>{f.first_name} {f.last_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={!form.department_id || !form.batch_code || !form.program_id || !form.academic_year || !form.section || !form.strength} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">Create</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SubjectsTab() {
  const [items, setItems] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ program_id: '', semester: '' })
  const [form, setForm] = useState({
    department_id: '', subject_code: '', subject_name: '', program_id: '',
    semester: '1', credits: '4', subject_type: SUBJECT_TYPES[0],
    course_category: COURSE_CATEGORIES[0], contact_hours_per_week: '4'
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.program_id) params.set('program_id', filters.program_id)
      if (filters.semester) params.set('semester', filters.semester)
      const res = await apiFetch(`/subjects?${params}`); const json = await res.json(); setItems(json.data || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [filters])
  useEffect(() => {
    apiFetch('/departments').then(r => r.json()).then(j => setDepartments(j.data || [])).catch(() => {})
    apiFetch('/programs').then(r => r.json()).then(j => setPrograms(j.data || [])).catch(() => {})
  }, [])

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
          <select value={filters.program_id} onChange={(e) => setFilters(p => ({ ...p, program_id: e.target.value }))} className={inputCls}>
            <option value="">All Programs</option>
            {programs.map((p: any) => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
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
              <p className="text-[#90A6BD] text-sm mt-1">{s.program_name} · Sem {s.semester} · {s.subject_type} · {s.credits} credits</p>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title="New Subject" onClose={() => setShowModal(false)}>
          {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
          {programs.length === 0 && <p className="text-[#F59E0B] text-xs mb-3">No programs exist yet — create one on the Programs tab first.</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className={`col-span-2 ${inputCls}`}>
              <option value="">Department…</option>
              {departments.map((d: any) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
            <input placeholder="Subject Code" value={form.subject_code} onChange={(e) => setForm(p => ({ ...p, subject_code: e.target.value }))} className={inputCls} />
            <input placeholder="Subject Name" value={form.subject_name} onChange={(e) => setForm(p => ({ ...p, subject_name: e.target.value }))} className={inputCls} />
            <select value={form.program_id} onChange={(e) => setForm(p => ({ ...p, program_id: e.target.value }))} className={inputCls}>
              <option value="">Program…</option>
              {programs.map((p: any) => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
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
            <button onClick={handleCreate} disabled={!form.program_id} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">Create</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function FacultyTab() {
  const admin = getAdmin()
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN'

  const [faculty, setFaculty] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    department_id: '', employee_id: '', first_name: '', last_name: '',
    email: '', phone: '', designation: DESIGNATIONS[0], password: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createdUsername, setCreatedUsername] = useState('')

  const fetchFaculty = async () => {
    setLoading(true)
    try { const res = await apiFetch('/faculty'); const json = await res.json(); setFaculty(json.data || []) }
    catch { setFaculty([]) } finally { setLoading(false) }
  }
  useEffect(() => { fetchFaculty() }, [])
  useEffect(() => { apiFetch('/departments').then(r => r.json()).then(j => setDepartments(j.data || [])).catch(() => {}) }, [])

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      const res = await apiFetch('/faculty', { method: 'POST', body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to create faculty'); return }
      setCreatedUsername(json.data.account.username)
      fetchFaculty()
    } catch { setError('Network error') } finally { setSubmitting(false) }
  }

  const closeModal = () => {
    setShowModal(false); setError(''); setCreatedUsername('')
    setForm({ department_id: '', employee_id: '', first_name: '', last_name: '', email: '', phone: '', designation: DESIGNATIONS[0], password: '' })
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this faculty member? Their login will also be disabled.')) return
    await apiFetch(`/faculty/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchFaculty()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#90A6BD] text-sm">Creating a faculty member automatically creates their login — you set the initial password, they can change it later.</p>
        {canManage && (
          <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-5 py-2 rounded-xl text-sm whitespace-nowrap">+ New Faculty</button>
        )}
      </div>
      {loading ? <p className="text-[#90A6BD]">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faculty.map((f: any) => (
            <div key={f.faculty_id} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-bold">{f.first_name} {f.last_name}</p>
                  <p className="text-[#90A6BD] text-sm">{f.designation} · {f.department_name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${f.account_status === 'ACTIVE' ? 'bg-[#14532D] text-[#4ADE80]' : 'bg-[#2A1A1A] text-[#F87171]'}`}>
                  {f.account_status || 'NO LOGIN'}
                </span>
              </div>
              <div className="text-sm text-[#90A6BD] space-y-1 mt-2">
                <p>Username: <span className="text-white font-mono">{f.username || '—'}</span></p>
                <p>Email: <span className="text-white">{f.email}</span></p>
              </div>
              {canManage && (
                <button onClick={() => handleDeactivate(f.faculty_id)} className="mt-4 text-[#F87171] text-sm hover:text-white transition-colors">Deactivate</button>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal title={createdUsername ? 'Faculty created' : 'New Faculty'} onClose={closeModal}>
          {createdUsername ? (
            <>
              <p className="text-[#90A6BD] text-sm mb-4">Share this username with them — they already know the password you set.</p>
              <p className="text-center text-2xl font-mono font-bold text-[#4ADE80] bg-[#0D1727] rounded-xl py-6 mb-5">{createdUsername}</p>
              <button onClick={closeModal} className="w-full bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm">Done</button>
            </>
          ) : (
            <>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name" value={form.first_name} onChange={(e) => setForm(p => ({ ...p, first_name: e.target.value }))} className={inputCls} />
                <input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm(p => ({ ...p, last_name: e.target.value }))} className={inputCls} />
                <input placeholder="Employee ID" value={form.employee_id} onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))} className={`col-span-2 ${inputCls}`} />
                <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className={`col-span-2 ${inputCls}`} />
                <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className={`col-span-2 ${inputCls}`} />
                <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className={inputCls}>
                  <option value="">Department…</option>
                  {departments.map((d: any) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                </select>
                <select value={form.designation} onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))} className={inputCls}>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input placeholder="Initial Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} className={`col-span-2 ${inputCls}`} />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={closeModal} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting ? 'Creating...' : 'Create Faculty'}</button>
              </div>
            </>
          )}
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

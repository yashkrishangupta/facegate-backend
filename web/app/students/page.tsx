'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn } from '../../lib/auth'

interface Student {
  student_id: string
  registration_number: string
  roll_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  gender: string
  date_of_birth?: string
  profile_photo_url?: string
  admission_year: number
  student_status: string
  batch_code?: string
  academic_year?: string
  program?: string
  semester?: number
  department?: string
  enrollment_status?: 'ENROLLED' | 'NOT_ENROLLED'
  enrolled_on?: string
}

interface Batch {
  batch_id: string
  batch_code: string
  program_id: string
  program_name: string
  academic_year: string
  semester: number
}

interface Program { program_id: string; program_name: string }

const inputCls = "bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]"

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Filters — cascading: academic year / program narrow the semester and
  // batch dropdowns. Program comes straight from /programs now (a real
  // table), not derived from whatever batches happen to exist.
  const [filters, setFilters] = useState({ academic_year: '', program_id: '', semester: '', batch_id: '' })

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    academicYear: '', programId: '', semester: '', batchId: '',
    registrationNumber: '', rollNumber: '', firstName: '',
    lastName: '', email: '', phone: '', gender: 'Male', admissionYear: '2024',
    dateOfBirth: '', profilePhotoUrl: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchBatches = async () => {
    try { const res = await apiFetch('/batches'); const json = await res.json(); setBatches(json.data || []) }
    catch { setBatches([]) }
  }
  const fetchPrograms = async () => {
    try { const res = await apiFetch('/programs'); const json = await res.json(); setPrograms(json.data || []) }
    catch { setPrograms([]) }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.academic_year) params.set('academic_year', filters.academic_year)
      if (filters.program_id) params.set('program_id', filters.program_id)
      if (filters.semester) params.set('semester', filters.semester)
      if (filters.batch_id) params.set('batch_id', filters.batch_id)
      const res = await apiFetch(`/students?${params}`)
      const json = await res.json()
      setStudents(json.data || [])
    } catch { setStudents([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    fetchBatches()
    fetchPrograms()
  }, [])

  useEffect(() => { fetchStudents() }, [filters])

  // Academic years still derived from batches (no separate table for
  // those, unlike program). Semester/batch dropdowns narrow based on
  // whichever academic_year/program_id are currently selected.
  const academicYears = useMemo(() => Array.from(new Set(batches.map(b => b.academic_year))).sort().reverse(), [batches])
  const semesters = useMemo(() => Array.from(new Set(
    batches.filter(b =>
      (!filters.academic_year || b.academic_year === filters.academic_year) &&
      (!filters.program_id || b.program_id === filters.program_id)
    ).map(b => b.semester)
  )).sort((a, b) => a - b), [batches, filters.academic_year, filters.program_id])
  const filteredBatchOptions = useMemo(() => batches.filter(b =>
    (!filters.academic_year || b.academic_year === filters.academic_year) &&
    (!filters.program_id || b.program_id === filters.program_id) &&
    (!filters.semester || String(b.semester) === filters.semester)
  ), [batches, filters])

  // Same cascading logic, scoped to the create-student form's own selections.
  const formSemesters = useMemo(() => Array.from(new Set(
    batches.filter(b =>
      (!form.academicYear || b.academic_year === form.academicYear) &&
      (!form.programId || b.program_id === form.programId)
    ).map(b => b.semester)
  )).sort((a, b) => a - b), [batches, form.academicYear, form.programId])
  const formBatchOptions = useMemo(() => batches.filter(b =>
    (!form.academicYear || b.academic_year === form.academicYear) &&
    (!form.programId || b.program_id === form.programId) &&
    (!form.semester || String(b.semester) === form.semester)
  ), [batches, form])

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.registration_number?.toLowerCase().includes(q)
    )
  }, [students, search])

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      const res = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          batch_id: form.batchId,
          registration_number: form.registrationNumber,
          roll_number: form.rollNumber,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          gender: form.gender,
          admission_year: Number(form.admissionYear),
          date_of_birth: form.dateOfBirth || undefined,
          profile_photo_url: form.profilePhotoUrl || undefined
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to create student')
        return
      }
      setShowModal(false)
      setForm({ academicYear: '', programId: '', semester: '', batchId: '', registrationNumber: '', rollNumber: '', firstName: '', lastName: '', email: '', phone: '', gender: 'Male', admissionYear: '2024', dateOfBirth: '', profilePhotoUrl: '' })
      fetchStudents()
    } catch { setError('Network error — is the API server running?') } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    setError('')
    try {
      const res = await apiFetch(`/students/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) { setError(json.message || 'Failed to delete student'); return }
    } catch { setError('Network error — is the API server running?') }
    fetchStudents()
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Students</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <select value={filters.academic_year} onChange={(e) => setFilters({ academic_year: e.target.value, program_id: '', semester: '', batch_id: '' })} className={inputCls}>
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
          {(filters.academic_year || filters.program_id || filters.semester || filters.batch_id) && (
            <button onClick={() => setFilters({ academic_year: '', program_id: '', semester: '', batch_id: '' })} className="text-[#F87171] text-sm px-2">Clear</button>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <input type="text" placeholder="Search students..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#1A2436] border border-[#2F4E73] rounded-xl px-4 py-3 text-white placeholder-[#90A6BD] focus:outline-none focus:border-[#5DA9FF]" />
          <button onClick={() => setShowModal(true)} className="bg-[#5DA9FF] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90">+ Add Student</button>
        </div>

        {error && !showModal && <p className="text-[#F87171] text-sm mb-3">{error}</p>}

        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#2F4E73]">
              {['Photo', 'Roll No', 'Name', 'DOB', 'Batch', 'Program', 'Semester', 'Enrollment', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left p-4 text-[#90A6BD] text-sm font-bold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={10} className="text-center text-[#90A6BD] p-8">Loading...</td></tr>
              : filteredBySearch.length === 0 ? <tr><td colSpan={10} className="text-center text-[#90A6BD] p-8">No students found.</td></tr>
              : filteredBySearch.map((s) => (
                <tr key={s.student_id} className="border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors">
                  <td className="p-4">
                    {s.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-[#2F4E73]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#2F4E73] flex items-center justify-center text-xs text-[#90A6BD] font-bold">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-[#5DA9FF] font-mono text-sm">{s.roll_number}</td>
                  <td className="p-4 text-white">{s.first_name} {s.last_name}</td>
                  <td className="p-4 text-[#90A6BD] text-sm">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-[#90A6BD]">{s.batch_code || '—'}</td>
                  <td className="p-4 text-[#90A6BD]">{s.program || '—'}</td>
                  <td className="p-4 text-[#90A6BD]">{s.semester ?? '—'}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.enrollment_status === 'ENROLLED' ? 'bg-[#14532D] text-[#4ADE80]' : 'bg-[#2A1A00] text-[#F59E0B]'}`}>
                      {s.enrollment_status === 'ENROLLED' ? 'Enrolled' : 'Not Enrolled'}
                    </span>
                  </td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${s.student_status === 'ACTIVE' ? 'bg-[#14532D] text-[#4ADE80]' : 'bg-[#2A1A00] text-[#F59E0B]'}`}>{s.student_status || 'ACTIVE'}</span></td>
                  <td className="p-4"><button onClick={() => handleDelete(s.student_id)} className="text-[#F87171] text-sm hover:text-white">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-white font-bold text-lg mb-4">Add Student</h2>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <p className="text-[#90A6BD] text-xs mb-2 font-bold uppercase">Batch</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select value={form.academicYear} onChange={(e) => setForm(p => ({ ...p, academicYear: e.target.value, semester: '', batchId: '' }))} className={inputCls}>
                  <option value="">Academic Year…</option>
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={form.programId} onChange={(e) => setForm(p => ({ ...p, programId: e.target.value, semester: '', batchId: '' }))} className={inputCls}>
                  <option value="">Program…</option>
                  {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                </select>
                <select value={form.semester} onChange={(e) => setForm(p => ({ ...p, semester: e.target.value, batchId: '' }))} className={inputCls}>
                  <option value="">Semester…</option>
                  {formSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
                <select value={form.batchId} onChange={(e) => setForm(p => ({ ...p, batchId: e.target.value }))} className={inputCls}>
                  <option value="">Batch…</option>
                  {formBatchOptions.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_code}</option>)}
                </select>
              </div>
              {batches.length === 0 && (
                <p className="text-[#F59E0B] text-xs mb-3">No batches exist yet — create one on the Master Data page first.</p>
              )}
              <p className="text-[#90A6BD] text-xs mb-2 font-bold uppercase">Student Details</p>
              <div className="flex flex-col gap-3">
                <input placeholder="Registration Number" value={form.registrationNumber}
                  onChange={(e) => setForm(p => ({ ...p, registrationNumber: e.target.value }))} className={inputCls} />
                <input placeholder="Roll Number" value={form.rollNumber}
                  onChange={(e) => setForm(p => ({ ...p, rollNumber: e.target.value }))} className={inputCls} />
                <input placeholder="First Name" value={form.firstName}
                  onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} className={inputCls} />
                <input placeholder="Last Name" value={form.lastName}
                  onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} className={inputCls} />
                <input placeholder="Email (optional)" value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                <input placeholder="Phone (optional)" value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                <select value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                  {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                </select>
                <input placeholder="Admission Year" type="number" value={form.admissionYear}
                  onChange={(e) => setForm(p => ({ ...p, admissionYear: e.target.value }))} className={inputCls} />
                <div>
                  <p className="text-[#90A6BD] text-xs mb-1">Date of Birth (optional)</p>
                  <input type="date" value={form.dateOfBirth}
                    onChange={(e) => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <input placeholder="Profile Photo URL (optional)" value={form.profilePhotoUrl}
                  onChange={(e) => setForm(p => ({ ...p, profilePhotoUrl: e.target.value }))} className={inputCls} />
                {form.profilePhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.profilePhotoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-[#2F4E73]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowModal(false); setError('') }} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting || !form.batchId || !form.registrationNumber || !form.rollNumber || !form.firstName || !form.lastName} className="flex-1 bg-[#5DA9FF] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

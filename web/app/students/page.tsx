'use client'
import { useEffect, useState, useMemo } from 'react'
import { API_URL } from '../../lib/config'

interface Student {
  student_id: string
  registration_number: string
  roll_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  gender: string
  admission_year: number
  student_status: string
  batch_code?: string
  semester?: number
  department?: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    batchId: '', registrationNumber: '', rollNumber: '', firstName: '',
    lastName: '', email: '', phone: '', gender: 'Male', admissionYear: '2024'
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/students`)
      const json = await res.json()
      setStudents(json.data || [])
    } catch { setStudents([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchStudents() }, [])

  // The backend doesn't support server-side search yet, so we filter
  // client-side against the fields visible in the table.
  const filtered = useMemo(() => {
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
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: form.batchId,
          registration_number: form.registrationNumber,
          roll_number: form.rollNumber,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          gender: form.gender,
          admission_year: Number(form.admissionYear)
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to create student')
        return
      }
      setShowModal(false)
      setForm({ batchId: '', registrationNumber: '', rollNumber: '', firstName: '', lastName: '', email: '', phone: '', gender: 'Male', admissionYear: '2024' })
      fetchStudents()
    } catch { setError('Network error — is the API server running?') } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchStudents()
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Students</h1>
        </div>
        <div className="flex gap-4 mb-6">
          <input type="text" placeholder="Search students..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#1A2436] border border-[#2F4E73] rounded-xl px-4 py-3 text-white placeholder-[#90A6BD] focus:outline-none focus:border-[#5DA9FF]" />
          <button onClick={() => setShowModal(true)} className="bg-[#5DA9FF] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90">+ Add Student</button>
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[#2F4E73]">
              {['Roll No', 'Name', 'Batch', 'Semester', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left p-4 text-[#90A6BD] text-sm font-bold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center text-[#90A6BD] p-8">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="text-center text-[#90A6BD] p-8">No students found. Add your first student to get started.</td></tr>
              : filtered.map((s) => (
                <tr key={s.student_id} className="border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors">
                  <td className="p-4 text-[#5DA9FF] font-mono text-sm">{s.roll_number}</td>
                  <td className="p-4 text-white">{s.first_name} {s.last_name}</td>
                  <td className="p-4 text-[#90A6BD]">{s.batch_code || '—'}</td>
                  <td className="p-4 text-[#90A6BD]">{s.semester ?? '—'}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${s.student_status === 'ACTIVE' ? 'bg-[#14532D] text-[#4ADE80]' : 'bg-[#2A1A00] text-[#F59E0B]'}`}>{s.student_status || 'ACTIVE'}</span></td>
                  <td className="p-4"><button onClick={() => handleDelete(s.student_id)} className="text-[#F87171] text-sm hover:text-white">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-4">Add Student</h2>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <div className="flex flex-col gap-3">
                <input placeholder="Batch ID (UUID)" value={form.batchId}
                  onChange={(e) => setForm(p => ({ ...p, batchId: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Registration Number" value={form.registrationNumber}
                  onChange={(e) => setForm(p => ({ ...p, registrationNumber: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Roll Number" value={form.rollNumber}
                  onChange={(e) => setForm(p => ({ ...p, rollNumber: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="First Name" value={form.firstName}
                  onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Last Name" value={form.lastName}
                  onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Email (optional)" value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <input placeholder="Phone (optional)" value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                <select value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]">
                  {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                </select>
                <input placeholder="Admission Year" type="number" value={form.admissionYear}
                  onChange={(e) => setForm(p => ({ ...p, admissionYear: e.target.value }))}
                  className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowModal(false); setError('') }} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#5DA9FF] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

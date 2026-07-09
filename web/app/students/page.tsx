'use client'
import { useEffect, useState } from 'react'
import client from '../api/client'

interface Student {
  id: string; rollNumber: string; fullName: string
  batch?: { batchCode: string }; enrollmentStatus?: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ rollNumber: '', registrationNumber: '', fullName: '', email: '', phone: '', batchId: '', gender: 'Male' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await client.get('/api/v1/students', { params: { search, limit: 50 } })
      setStudents(res.data.students || res.data.data || [])
    } catch { setStudents([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchStudents() }, [search])

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      await client.post('/api/v1/students', form)
      setShowModal(false)
      setForm({ rollNumber: '', registrationNumber: '', fullName: '', email: '', phone: '', batchId: '', gender: 'Male' })
      fetchStudents()
    } catch (e: any) { setError(e.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    await client.delete(`/api/v1/students/${id}`).catch(() => {})
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
              {['Roll No','Name','Batch','Status','Enrollment','Actions'].map(h => (
                <th key={h} className="text-left p-4 text-[#90A6BD] text-sm font-bold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center text-[#90A6BD] p-8">Loading...</td></tr>
              : students.length === 0 ? <tr><td colSpan={6} className="text-center text-[#90A6BD] p-8">No students found. Add your first student to get started.</td></tr>
              : students.map((s) => (
                <tr key={s.id} className="border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors">
                  <td className="p-4 text-[#5DA9FF] font-mono text-sm">{s.rollNumber}</td>
                  <td className="p-4 text-white">{s.fullName}</td>
                  <td className="p-4 text-[#90A6BD]">{s.batch?.batchCode || '—'}</td>
                  <td className="p-4"><span className="text-xs bg-[#14532D] text-[#4ADE80] px-2 py-1 rounded-full">Active</span></td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${s.enrollmentStatus === 'ENROLLED' ? 'bg-[#14532D] text-[#4ADE80]' : 'bg-[#2A1A00] text-[#F59E0B]'}`}>{s.enrollmentStatus || 'PENDING'}</span></td>
                  <td className="p-4"><button onClick={() => handleDelete(s.id)} className="text-[#F87171] text-sm hover:text-white">Delete</button></td>
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
                {(['rollNumber','registrationNumber','fullName','email','phone'] as const).map((f) => (
                  <input key={f} placeholder={f.replace(/([A-Z])/g,' $1').trim()} value={form[f]}
                    onChange={(e) => setForm(p => ({...p,[f]:e.target.value}))}
                    className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => {setShowModal(false);setError('')}} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#5DA9FF] text-[#0D1727] font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting?'Creating...':'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

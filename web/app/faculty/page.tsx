'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin } from '../../lib/auth'

interface Faculty {
  faculty_id: string
  department_id: string
  department_name: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  designation: string
  username?: string
  account_status?: string
}

interface Department { department_id: string; department_name: string }

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD']

export default function FacultyPage() {
  const router = useRouter()
  const admin = getAdmin()
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN'

  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    department_id: '', employee_id: '', first_name: '', last_name: '',
    email: '', phone: '', designation: DESIGNATIONS[0], password: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createdUsername, setCreatedUsername] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    fetchFaculty()
    fetchDepartments()
  }, [])

  const fetchFaculty = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/faculty')
      const json = await res.json()
      setFaculty(json.data || [])
    } catch { setFaculty([]) } finally { setLoading(false) }
  }

  const fetchDepartments = async () => {
    try {
      const res = await apiFetch('/departments')
      const json = await res.json()
      setDepartments(json.data || [])
    } catch { setDepartments([]) }
  }

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      const res = await apiFetch('/faculty', { method: 'POST', body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to create faculty')
        return
      }
      setCreatedUsername(json.data.account.username)
      fetchFaculty()
    } catch {
      setError('Network error — is the API server running?')
    } finally {
      setSubmitting(false)
    }
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
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Faculty</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD]">Creating a faculty member automatically creates their login — you set the initial password, they can change it later.</p>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 whitespace-nowrap">+ New Faculty</button>
          )}
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faculty.map((f) => (
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              {createdUsername ? (
                <>
                  <h2 className="text-white font-bold text-lg mb-2">Faculty created</h2>
                  <p className="text-[#90A6BD] text-sm mb-4">Share this username with them — they already know the password you set.</p>
                  <p className="text-center text-2xl font-mono font-bold text-[#4ADE80] bg-[#0D1727] rounded-xl py-6 mb-5">{createdUsername}</p>
                  <button onClick={closeModal} className="w-full bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm">Done</button>
                </>
              ) : (
                <>
                  <h2 className="text-white font-bold text-lg mb-4">New Faculty</h2>
                  {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="First Name" value={form.first_name} onChange={(e) => setForm(p => ({ ...p, first_name: e.target.value }))} className="col-span-1 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm" />
                    <input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm(p => ({ ...p, last_name: e.target.value }))} className="col-span-1 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm" />
                    <input placeholder="Employee ID" value={form.employee_id} onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))} className="col-span-2 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm" />
                    <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="col-span-2 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm" />
                    <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="col-span-2 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm" />
                    <select value={form.department_id} onChange={(e) => setForm(p => ({ ...p, department_id: e.target.value }))} className="col-span-1 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm">
                      <option value="">Department…</option>
                      {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                    </select>
                    <select value={form.designation} onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))} className="col-span-1 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm">
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input placeholder="Initial Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} className="col-span-2 bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm" />
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={closeModal} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                    <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting ? 'Creating...' : 'Create Faculty'}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

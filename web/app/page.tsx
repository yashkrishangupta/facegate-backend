'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin, clearSession } from '../lib/auth'

export default function Home() {
  const router = useRouter()
  const [admin, setAdmin] = useState<ReturnType<typeof getAdmin>>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: '—',
    presentToday: '—',
    activeDevices: '—',
    openConflicts: '—',
  })

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return }
    setAdmin(getAdmin())
    setCheckingAuth(false)
    apiFetch('/dashboard/summary')
      .then((res) => res.json())
      .then((json) => {
        const d = json.data
        setStats({
          totalStudents: d.totalStudents ?? '—',
          presentToday: d.attendanceToday ?? '—',
          activeDevices: d.activeDevices ?? '—',
          openConflicts: d.pendingConflicts ?? '—',
        })
      })
      .catch((err) => console.error('Dashboard summary fetch failed:', err))
  }, [])

  // Render nothing while the redirect decision is still pending — avoids a
  // one-frame flash of the full dashboard for anyone who isn't logged in.
  if (checkingAuth) return null

  const isAdmin = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN'

  const handleLogout = () => {
    clearSession()
    router.push('/login')
  }

  const tiles = [
    { title: "Rooms", desc: "Create rooms for device pairing", href: "/rooms", color: "#5DA9FF" },
    { title: "Devices", desc: "Monitor registered devices", href: "/devices", color: "#4ADE80" },
    { title: "Students", desc: "Manage enrolled students", href: "/students", color: "#5DA9FF" },
    { title: "Timetable", desc: "Setup weekly schedule", href: "/timetable", color: "#F59E0B" },
    { title: "Today", desc: "Live status across all rooms", href: "/today", color: "#38BDF8" },
    { title: "Attendance Reports", desc: "View, filter, correct attendance", href: "/reports", color: "#A78BFA" },
    { title: "Holidays", desc: "Manage holidays", href: "/holidays", color: "#F87171" },
    { title: "Conflicts", desc: "Resolve face recognition conflicts", href: "/conflicts", color: "#FB923C" },
    { title: "Faculty", desc: "Manage faculty + their logins", href: "/faculty", color: "#4ADE80", adminOnly: true },
    { title: "Master Data", desc: "Departments, subjects, calendar", href: "/master-data", color: "#5DA9FF", adminOnly: true },
    { title: "Change Log", desc: "Audit trail of admin actions", href: "/change-log", color: "#90A6BD", adminOnly: true },
  ]

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">FaceGate</h1>
            <p className="text-[#90A6BD] mt-1">
              {admin ? `Welcome, ${admin.first_name} — ${admin.role}` : 'Admin Dashboard'}
            </p>
          </div>
          {admin && (
            <button onClick={handleLogout} className="text-[#F87171] text-sm hover:text-white transition-colors">Log out</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Students", value: stats.totalStudents, color: "#5DA9FF" },
            { label: "Present Today", value: stats.presentToday, color: "#4ADE80" },
            { label: "Active Devices", value: stats.activeDevices, color: "#F59E0B" },
            { label: "Open Conflicts", value: stats.openConflicts, color: "#F87171" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1A2436] rounded-2xl p-5 border border-[#2F4E73]">
              <p style={{ color: stat.color }} className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[#90A6BD] text-xs mt-1 font-bold tracking-wide uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tiles.filter(t => !t.adminOnly || isAdmin).map((tile) => (
            <Link href={tile.href} key={tile.title}>
              <div className="bg-[#1A2436] rounded-2xl p-6 border border-[#2F4E73] hover:border-[#5DA9FF] transition-all cursor-pointer">
                <p style={{ color: tile.color }} className="text-lg font-bold">{tile.title}</p>
                <p className="text-[#90A6BD] text-sm mt-1">{tile.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
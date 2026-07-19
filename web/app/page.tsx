'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin, clearSession } from '../lib/auth'
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import QuickActionCard from "../components/QuickActionCard";

import {
  Users,
  Smartphone,
  AlertTriangle,
  GraduationCap,
  CalendarDays,
  Bell,
  Building2,
  ClipboardList,
  BookOpen,
  Clock,
} from "lucide-react";

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
    { title: "Students", desc: "Manage enrolled students", href: "/students", color: "#5DA9FF" },
    { title: "Rooms", desc: "Create rooms for device pairing", href: "/rooms", color: "#5DA9FF", adminOnly: true },
    { title: "Devices", desc: "Monitor registered devices", href: "/devices", color: "#4ADE80", adminOnly: true },
    { title: "Attendance Reports", desc: "View, filter, correct attendance", href: "/reports", color: "#A78BFA" },
    { title: "Today", desc: "Live status across all rooms", href: "/today", color: "#38BDF8" },
    { title: "Timetable", desc: "Setup weekly schedule", href: "/timetable", color: "#F59E0B" },
    { title: "Holidays", desc: "Manage holidays", href: "/holidays", color: "#F87171" },
    { title: "Conflicts", desc: "Resolve face recognition conflicts", href: "/conflicts", color: "#FB923C" },
    { title: "Change Log", desc: "Audit trail of admin actions", href: "/change-log", color: "#90A6BD", adminOnly: true },
    { title: "Master Data", desc: "Departments, programs, batches, subjects, faculty, calendar", href: "/master-data", color: "#5DA9FF", adminOnly: true },
    { title: "Notifications", desc: "System alerts and announcements", href: "/notifications", color: "#F59E0B" },
  ]
const icons = {
  Students: <Users size={26} color="#5DA9FF" />,
  Rooms: <Building2 size={26} color="#5DA9FF" />,
  Devices: <Smartphone size={26} color="#4ADE80" />,
  "Attendance Reports": <ClipboardList size={26} color="#A78BFA" />,
  Today: <Clock size={26} color="#38BDF8" />,
  Timetable: <CalendarDays size={26} color="#F59E0B" />,
  Holidays: <CalendarDays size={26} color="#F87171" />,
  Conflicts: <AlertTriangle size={26} color="#FB923C" />,
  "Change Log": <BookOpen size={26} color="#90A6BD" />,
  "Master Data": <Building2 size={26} color="#5DA9FF" />,
  Notifications: <Bell size={26} color="#F59E0B" />,
};

 return (
   <main className="min-h-screen bg-[#0D1727] text-white p-8">
     <div className="max-w-6xl mx-auto">

       <Header
         name={admin?.first_name ?? "Admin"}
         role={admin?.role ?? ""}
         onLogout={handleLogout}
       />

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

  <StatCard
    title="Total Students"
    value={stats.totalStudents}
    color="#3B82F6"
    icon={<GraduationCap size={28} color="#3B82F6" />}
  />

  <StatCard
    title="Present Today"
    value={stats.presentToday}
    color="#22C55E"
    icon={<Users size={28} color="#22C55E" />}
  />

  <StatCard
    title="Active Devices"
    value={stats.activeDevices}
    color="#F59E0B"
    icon={<Smartphone size={28} color="#F59E0B" />}
  />

  <StatCard
    title="Open Conflicts"
    value={stats.openConflicts}
    color="#EF4444"
    icon={<AlertTriangle size={28} color="#EF4444" />}
  />

</div>

<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
  {tiles
    .filter((t) => !t.adminOnly || isAdmin)
    .map((tile) => (
      <QuickActionCard
        key={tile.title}
        title={tile.title}
        description={tile.desc}
        href={tile.href}
        color={tile.color}
        icon={icons[tile.title as keyof typeof icons]}
      />
    ))}
</div>

    </div>
  </main>
);
}
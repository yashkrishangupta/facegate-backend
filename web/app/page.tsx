'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin, clearSession } from '../lib/auth'
import StatCard from "../components/StatCard";
import QuickActionCard from "../components/QuickActionCard";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import RecentActivity from "../components/RecentActivity";
import DashboardOverview from "../components/DashboardOverview";
import WelcomeBanner from "../components/WelcomeBanner";
import ProgressCards from "../components/ProgressCards";
import UpcomingClasses from "../components/UpcomingClasses";
import SystemStatus from "../components/SystemStatus";
import TopRooms from "../components/TopRooms";
import LatestStudents from "../components/LatestStudents";
import Announcements from "../components/Announcements";
import MiniCalendar from "../components/MiniCalendar";
import AttendanceTrend from "../components/AttendanceTrend";

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
  <main className="min-h-screen flex bg-gradient-to-br from-[#0B1322] via-[#122038] to-[#1A2740] text-white">

    <Sidebar />

    <div className="flex-1 p-8">

      <Topbar
        name={admin?.first_name ?? "Admin"}
        role={admin?.role ?? ""}
        onLogout={handleLogout}
      />
<WelcomeBanner
  name={admin?.first_name ?? "Admin"}
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

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">

  <RecentActivity />
  <DashboardOverview />

  <ProgressCards />
  <UpcomingClasses />

  <SystemStatus />
  <TopRooms />

  <LatestStudents />
  <Announcements />

  <MiniCalendar />
  <AttendanceTrend />

  </div>



<footer className="mt-10 text-center text-slate-500 text-sm">
  FaceGate Admin Dashboard • Version 1.0
</footer>


</div> {/* flex-1 p-8 */}

</main>
);
}
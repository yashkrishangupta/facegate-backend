'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isLoggedIn, getAdmin, clearSession } from '../lib/auth'
import StatCard from "../components/StatCard";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import RecentActivity from "../components/RecentActivity";
import DashboardOverview from "../components/DashboardOverview";
import WelcomeBanner from "../components/WelcomeBanner";
import SystemStatus from "../components/SystemStatus";
import LatestStudents from "../components/LatestStudents";
import AttendanceTrend from "../components/AttendanceTrend";
const [sidebarOpen, setSidebarOpen] = useState(false);


import {
  Users,
  Smartphone,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

export default function Home() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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


return (
  <main className="min-h-screen flex bg-gradient-to-br from-[#0B1322] via-[#122038] to-[#1A2740] text-white">

    <Sidebar open={sidebarOpen} />

    <div className="flex-1 px-10 py-6">

      <Topbar
        name={admin?.first_name ?? "Admin"}
        role={admin?.role ?? ""}
        onLogout={handleLogout}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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


<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

  <RecentActivity />

  <DashboardOverview />

  <SystemStatus />

  <LatestStudents />

  <AttendanceTrend />

  </div>



<footer className="mt-16 text-center text-slate-500 text-sm">
  FaceGate Admin Dashboard • Version 1.0
</footer>


</div> {/* flex-1 p-8 */}

</main>
);
}
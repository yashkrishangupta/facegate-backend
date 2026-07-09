'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import client from './api/client'

export default function Home() {
  const [stats, setStats] = useState({
    totalStudents: '—',
    presentToday: '—',
    activeDevices: '—',
    openConflicts: '—',
  })

  useEffect(() => {
    client.get('/api/v1/dashboard/summary')
      .then((res) => {
        const d = res.data.data
        setStats({
          totalStudents: d.totalStudents ?? '—',
          presentToday: d.attendanceToday ?? '—',
          activeDevices: d.activeDevices ?? '—',
          openConflicts: d.pendingConflicts ?? '—',
        })
      })
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">FaceGate</h1>
          <p className="text-[#90A6BD] mt-1">Admin Dashboard</p>
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
          {[
            { title: "Students", desc: "Manage enrolled students", href: "/students", color: "#5DA9FF" },
            { title: "Devices", desc: "Monitor registered devices", href: "/devices", color: "#4ADE80" },
            { title: "Timetable", desc: "Setup weekly schedule", href: "/timetable", color: "#F59E0B" },
            { title: "Attendance", desc: "View attendance reports", href: "/reports", color: "#A78BFA" },
            { title: "Holidays", desc: "Manage holidays", href: "/holidays", color: "#F87171" },
            { title: "Conflicts", desc: "Resolve face conflicts", href: "/conflicts", color: "#FB923C" },
          ].map((tile) => (
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

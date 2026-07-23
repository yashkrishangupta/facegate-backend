'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Smartphone,
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  Bell,
  BookOpen,
  LogOut,
  UserCircle2,
  X,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Rooms", href: "/rooms", icon: Building2, adminOnly: true },
  { name: "Devices", href: "/devices", icon: Smartphone, adminOnly: true },
  { name: "Master Data", href: "/master-data", icon: BookOpen, adminOnly: true },
  { name: "Reports", href: "/reports", icon: ClipboardList },
  { name: "Timetable", href: "/timetable", icon: CalendarDays },
  { name: "Holidays", href: "/holidays", icon: CalendarDays },
  { name: "Conflicts", href: "/conflicts", icon: AlertTriangle },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Change Log", href: "/change-log", icon: BookOpen, adminOnly: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
<aside
  className={`fixed top-0 left-0 z-40 h-screen w-64 overflow-y-auto bg-[#121C2E] border-r border-[#2F4E73] p-6 transform transition-transform duration-300 ${
    open ? "translate-x-0" : "-translate-x-full"
  }`}
>
<div className="flex items-center justify-between px-8 py-8">
  <div>
    <h1 className="text-3xl font-bold text-blue-400">
      FaceGate
    </h1>

    <p className="text-slate-400 text-sm mt-1">
      Attendance Dashboard
    </p>
  </div>

  <button
    onClick={onClose}
    className="p-2 rounded-lg hover:bg-slate-700"
  >
    <X size={22} />
  </button>
</div>

      <nav className="flex-1 px-4 space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${
                  active
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <Icon size={20} />
              <span className="font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}

      </nav>

      <div className="border-t border-slate-700 p-5">

        <div className="flex items-center gap-3 mb-4">

          <UserCircle2
            size={42}
            className="text-blue-400"
          />

          <div>
            <p className="font-semibold">
              Admin
            </p>

            <p className="text-xs text-slate-400">
              SUPER_ADMIN
            </p>
          </div>

        </div>

        <button className="flex items-center gap-2 text-red-400 hover:text-white transition">

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </aside>
  );
}
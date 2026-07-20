'use client';

import {
  UserPlus,
  CalendarCheck,
  AlertTriangle,
  Clock,
  Building2,
} from "lucide-react";

const activities = [
  {
    icon: <UserPlus size={18} className="text-green-400" />,
    title: "New student enrolled",
    time: "2 min ago",
  },
  {
    icon: <CalendarCheck size={18} className="text-blue-400" />,
    title: "Attendance marked",
    time: "10 min ago",
  },
  {
    icon: <Building2 size={18} className="text-purple-400" />,
    title: "Room created",
    time: "25 min ago",
  },
  {
    icon: <AlertTriangle size={18} className="text-orange-400" />,
    title: "Conflict detected",
    time: "1 hour ago",
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-semibold text-white">
          Recent Activity
        </h2>

        <Clock size={18} className="text-slate-400" />

      </div>

      <div className="space-y-5">

        {activities.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-[#2F4E73] pb-4 last:border-none"
          >
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-[#24324B] flex items-center justify-center">
                {item.icon}
              </div>

              <div>
                <p className="text-white font-medium">
                  {item.title}
                </p>

                <p className="text-xs text-slate-400">
                  System Activity
                </p>
              </div>

            </div>

            <span className="text-xs text-slate-500">
              {item.time}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}
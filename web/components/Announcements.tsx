'use client';

import { Bell } from "lucide-react";

const announcements = [
  {
    title: "Holiday Declared",
    desc: "15 August marked as National Holiday",
  },
  {
    title: "Timetable Updated",
    desc: "Semester 5 schedule has been published",
  },
  {
    title: "Device Maintenance",
    desc: "Server maintenance today at 6 PM",
  },
];

export default function Announcements() {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <div className="flex items-center gap-2 mb-5">
        <Bell className="text-yellow-400" size={22} />
        <h2 className="text-xl font-semibold text-white">
          Announcements
        </h2>
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <div
            key={item.title}
            className="bg-[#24324B] rounded-xl p-4"
          >
            <h3 className="text-white font-semibold">
              {item.title}
            </h3>

            <p className="text-slate-400 text-sm mt-1">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
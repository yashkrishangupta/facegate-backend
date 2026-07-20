'use client';

import { CalendarDays, Clock } from "lucide-react";

const classes = [
  {
    subject: "Machine Learning",
    room: "Room A-101",
    time: "09:00 AM",
  },
  {
    subject: "Database Systems",
    room: "Room B-204",
    time: "11:00 AM",
  },
  {
    subject: "Operating Systems",
    room: "Room C-305",
    time: "02:00 PM",
  },
];

export default function UpcomingClasses() {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="text-blue-400" size={22} />
        <h2 className="text-xl font-semibold text-white">
          Upcoming Classes
        </h2>
      </div>

      <div className="space-y-4">

        {classes.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center bg-[#24324B] rounded-xl p-4"
          >
            <div>
              <h3 className="font-semibold text-white">
                {item.subject}
              </h3>

              <p className="text-sm text-slate-400">
                {item.room}
              </p>
            </div>

            <div className="flex items-center gap-2 text-blue-400">
              <Clock size={16} />
              <span className="text-sm">
                {item.time}
              </span>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}
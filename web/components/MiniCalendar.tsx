'use client';

import { CalendarDays } from "lucide-react";

export default function MiniCalendar() {
  const today = new Date();

  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="text-blue-400" size={22} />
        <h2 className="text-xl font-semibold text-white">
          Calendar
        </h2>
      </div>

      <div className="text-center">

        <p className="text-slate-400">
          {today.toLocaleString("default", { month: "long" })}
        </p>

        <h1 className="text-5xl font-bold text-white mt-2">
          {today.getDate()}
        </h1>

        <p className="text-slate-400 mt-2">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
          })}
        </p>

      </div>

    </div>
  );
}
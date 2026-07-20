'use client';

import {
  Bell,
  Search,
  UserCircle2,
  LogOut,
} from "lucide-react";

interface Props {
  name: string;
  role: string;
  onLogout: () => void;
}

export default function Topbar({
  name,
  role,
  onLogout,
}: Props) {
  return (
    <header className="flex items-center justify-between mb-8">

      {/* Left */}
      <div>
        <h2 className="text-3xl font-bold text-white">
          Dashboard
        </h2>

        <p className="text-slate-400 mt-1">
          Welcome back, {name}
        </p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#1A2436] border border-[#2F4E73] rounded-xl px-4 py-2">

          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm text-white placeholder:text-slate-500 w-52"
          />

        </div>

        {/* Notification */}
        <button className="relative bg-[#1A2436] p-3 rounded-xl hover:bg-[#24324B] hover:scale-105 transition-all">

          <Bell size={20} />

          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>

        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 bg-[#1A2436] border border-[#2F4E73] rounded-xl px-4 py-2">

          <UserCircle2
            size={38}
            className="text-blue-400"
          />

          <div>

            <p className="font-semibold text-white">
              {name}
            </p>

            <p className="text-xs text-slate-400">
              {role}
            </p>

          </div>

        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 hover:scale-105 transition-all px-4 py-2 rounded-xl"
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </header>
  );
}
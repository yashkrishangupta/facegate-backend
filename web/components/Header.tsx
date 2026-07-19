'use client';

import { Bell, LogOut, Search } from "lucide-react";

interface HeaderProps {
  name: string;
  role: string;
  onLogout: () => void;
}

export default function Header({
  name,
  role,
  onLogout,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-10">

      <div>
        <h1 className="text-3xl font-bold text-white">
          👋 Welcome Back, {name}
        </h1>

        <p className="text-slate-400 mt-1">
          {role} • FaceGate Admin Dashboard
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2 bg-[#1A2436] border border-[#2F4E73] rounded-xl px-4 py-2">

          <Search size={18} className="text-slate-400" />

          <input
            placeholder="Search..."
            className="bg-transparent outline-none text-sm"
          />

        </div>

        <button className="bg-[#1A2436] border border-[#2F4E73] p-3 rounded-xl hover:bg-[#243146] transition">
          <Bell size={18}/>
        </button>

        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2 transition"
        >
          <LogOut size={18}/>
          Logout
        </button>

      </div>

    </div>
  );
}
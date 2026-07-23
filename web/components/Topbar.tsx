'use client';

import {
  Bell,
  UserCircle2,
  LogOut,
   Menu,
} from "lucide-react";

import Link from "next/link";


interface Props {
  name: string;
  role: string;
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function Topbar({
  name,
  role,
  onLogout,
  onMenuClick,
}: Props) {
  return (
    <header className="flex items-center justify-between mb-8">

      {/* Left */}
     <div className="flex items-center gap-4">

       <button
         onClick={onMenuClick}
         className="bg-[#1A2436] p-2 rounded-lg hover:bg-[#24324B] transition"
       >
         <Menu size={22} />
       </button>

       <div>
         <h2 className="text-2xl font-bold text-white">
           Dashboard
         </h2>

         <p className="text-sm text-slate-400">
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

     </div>

      {/* Right */}
      <div className="flex items-center gap-4">



        {/* Notification */}
       <Link
         href="/notifications"
         className="relative bg-[#1A2436] p-2 rounded-lg hover:bg-[#24324B] hover:scale-105 transition-all"
       >
         <Bell size={20} />

         <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
       </Link>

        {/* Profile */}
        <div className="flex items-center gap-3 bg-[#1A2436] border border-[#2F4E73] rounded-lg px-3 py-2">

          <UserCircle2
            size={32}
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
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 transition px-3 py-2 rounded-lg text-sm"
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </header>
  );
}
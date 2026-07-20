'use client';

import { ArrowRight, Sparkles } from "lucide-react";

interface Props {
  name: string;
}

export default function WelcomeBanner({ name }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 mb-8 shadow-2xl">

      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/10 rounded-full blur-2xl"></div>

      <div className="relative flex items-center justify-between">

        <div>

          <div className="flex items-center gap-2 mb-3">

            <Sparkles
              size={20}
              className="text-yellow-300"
            />

            <span className="text-sm font-medium text-blue-100 uppercase tracking-wider">
              FaceGate Dashboard
            </span>

          </div>

          <h1 className="text-4xl font-bold text-white">
            Welcome back,
            <span className="text-yellow-300"> {name}</span> 👋
          </h1>

          <p className="mt-3 max-w-xl text-blue-100 leading-7">
            Manage students, attendance, devices, reports and
            monitor your institution from one modern dashboard.
          </p>

          <p className="mt-3 text-sm text-blue-200">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <button className="mt-6 flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100 transition">

            Go to Reports

            <ArrowRight size={18} />

          </button>

        </div>

        {/* Right Side Illustration */}
        <div className="hidden lg:flex items-center justify-center">

          <div className="w-44 h-44 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">

           <div className="text-8xl animate-pulse">
             🚀
           </div>

          </div>

        </div>

      </div>

    </div>
  );
}
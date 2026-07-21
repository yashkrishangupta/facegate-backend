'use client';

import { ArrowRight, Sparkles } from "lucide-react";

interface Props {
  name: string;
}

export default function WelcomeBanner({ name }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 py-5 mb-6 shadow-xl">

      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/10 rounded-full blur-2xl"></div>

      <div className="relative">

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

          <h1 className="text-2xl font-bold text-white">
            Welcome back,
            <span className="text-yellow-300"> {name}</span> 👋
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Manage students, attendance and monitor your institution from one dashboard.
          </p>

          <p className="mt-3 text-sm text-blue-200">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>



        </div>

        </div>

      </div>

    </div>
  );
}
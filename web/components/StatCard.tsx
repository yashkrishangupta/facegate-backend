'use client';

import { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  color: string;
  icon: ReactNode;
}

export default function StatCard({
  title,
  value,
  color,
  icon,
}: Props) {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-2 text-white">
            {value}
          </h2>

          <div className="flex items-center gap-1 mt-3">

            <TrendingUp
              size={16}
              className="text-green-400"
            />

            <span className="text-green-400 text-sm">
              +5%
            </span>

            <span className="text-slate-500 text-sm">
              vs yesterday
            </span>

          </div>

        </div>

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: color + "20",
          }}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}
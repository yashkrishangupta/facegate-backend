'use client'

import { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
}: Props) {
  return (
    <div
      className="
      rounded-2xl
      p-6
      bg-[#1A2436]
      border
      border-[#2F4E73]
      shadow-lg
      hover:shadow-2xl
      hover:-translate-y-1
      transition-all
      "
    >
      <div className="flex justify-between items-center">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2
            className="text-3xl font-bold mt-2"
            style={{ color }}
          >
            {value}
          </h2>

        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: color + "20" }}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}
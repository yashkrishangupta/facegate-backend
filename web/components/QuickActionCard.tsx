'use client'

import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  href: string;
  color: string;
  icon: ReactNode;
}

export default function QuickActionCard({
  title,
  description,
  href,
  color,
  icon,
}: Props) {
  return (
    <Link href={href}>
      <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: color + "20" }}
        >
          {icon}
        </div>

        <h3
          className="text-lg font-semibold"
          style={{ color }}
        >
          {title}
        </h3>

        <p className="text-slate-400 text-sm mt-2">
          {description}
        </p>

      </div>
    </Link>
  );
}
'use client';

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

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
      <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400 hover:scale-105 transition-all duration-300 cursor-pointer">

        {/* Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 transition"></div>

        <div className="relative">

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
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

          <p className="text-slate-400 text-sm mt-2 leading-6">
            {description}
          </p>

          <div className="flex justify-end mt-6">

            <div className="w-10 h-10 rounded-full bg-[#24324B] flex items-center justify-center group-hover:bg-blue-500 transition">

              <ArrowRight
                size={18}
                className="group-hover:text-white"
              />

            </div>

          </div>

        </div>

      </div>
    </Link>
  );
}
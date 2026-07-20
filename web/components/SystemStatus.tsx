'use client';

import { CheckCircle, Server, Wifi, Database } from "lucide-react";

export default function SystemStatus() {
  const items = [
    {
      icon: <Server size={18} className="text-green-400" />,
      title: "Backend Server",
      status: "Online",
    },
    {
      icon: <Database size={18} className="text-green-400" />,
      title: "Database",
      status: "Connected",
    },
    {
      icon: <Wifi size={18} className="text-green-400" />,
      title: "Devices",
      status: "12 Active",
    },
    {
      icon: <CheckCircle size={18} className="text-green-400" />,
      title: "Attendance Service",
      status: "Running",
    },
  ];

  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <h2 className="text-xl font-semibold text-white mb-5">
        System Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {items.map((item) => (
          <div
            key={item.title}
            className="flex justify-between items-center bg-[#24324B] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              {item.icon}

              <div>
                <p className="text-white">{item.title}</p>
                <p className="text-sm text-slate-400">
                  {item.status}
                </p>
              </div>
            </div>

            <span className="w-3 h-3 rounded-full bg-green-500"></span>

          </div>
        ))}

      </div>

    </div>
  );
}
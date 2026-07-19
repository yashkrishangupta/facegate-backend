'use client';

export default function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

      {/* Attendance Chart */}
      <div className="bg-[#1A2436] rounded-2xl p-6 border border-[#2F4E73]">

        <h2 className="text-xl font-semibold mb-4">
          Attendance Overview
        </h2>

        <div className="h-64 rounded-xl bg-[#111827] flex items-center justify-center text-slate-500">
          📈 Attendance Chart
        </div>

      </div>

      {/* Student Distribution */}
      <div className="bg-[#1A2436] rounded-2xl p-6 border border-[#2F4E73]">

        <h2 className="text-xl font-semibold mb-4">
          Student Distribution
        </h2>

        <div className="h-64 rounded-xl bg-[#111827] flex items-center justify-center text-slate-500">
          🥧 Pie Chart
        </div>

      </div>

    </div>
  );
}
'use client';

export default function RecentActivity() {
  return (
    <div className="mt-8 bg-[#1A2436] rounded-2xl p-6 border border-[#2F4E73]">

      <h2 className="text-xl font-semibold mb-5">
        Recent Activity
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>✅ Student enrolled</span>
          <span className="text-slate-500">2 min ago</span>
        </div>

        <div className="flex justify-between">
          <span>📅 Attendance marked</span>
          <span className="text-slate-500">10 min ago</span>
        </div>

        <div className="flex justify-between">
          <span>⚠ Conflict detected</span>
          <span className="text-slate-500">25 min ago</span>
        </div>

      </div>

    </div>
  );
}
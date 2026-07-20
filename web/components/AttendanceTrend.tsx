'use client';

const data = [
  { day: "Mon", value: 85 },
  { day: "Tue", value: 92 },
  { day: "Wed", value: 88 },
  { day: "Thu", value: 95 },
  { day: "Fri", value: 90 },
];

export default function AttendanceTrend() {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <h2 className="text-xl font-semibold text-white mb-6">
        Weekly Attendance
      </h2>

      <div className="space-y-4">

        {data.map((item) => (
          <div key={item.day}>

            <div className="flex justify-between mb-2">
              <span className="text-slate-300">{item.day}</span>
              <span className="text-blue-400 font-semibold">
                {item.value}%
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#24324B]">

              <div
                className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${item.value}%` }}
              />

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
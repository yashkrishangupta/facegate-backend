'use client';

export default function ProgressCards() {
  const data = [
    { title: "Attendance Rate", value: "92%" },
    { title: "Rooms Active", value: "12" },
    { title: "Pending Reviews", value: "5" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {data.map((item) => (
        <div
          key={item.title}
          className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6"
        >
          <p className="text-slate-400">{item.title}</p>
          <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
        </div>
      ))}
    </div>
  );
}
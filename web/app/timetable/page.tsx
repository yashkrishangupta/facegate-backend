export default function TimetablePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Timetable Setup</h1>
        </div>
        <div className="flex gap-2 mb-6">
          {days.map((day, i) => (
            <button key={day} className={`px-4 py-2 rounded-xl text-sm font-bold ${i === 0 ? 'bg-[#5DA9FF] text-white' : 'bg-[#1A2436] text-[#90A6BD] border border-[#2F4E73]'}`}>
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
          <p className="text-[#90A6BD] font-bold">No periods for Monday</p>
          <button className="mt-4 bg-[#5DA9FF] text-white font-bold px-6 py-3 rounded-xl">+ Add Period</button>
        </div>
      </div>
    </main>
  )
}

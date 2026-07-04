export default function HolidaysPage() {
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Holidays</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD]">Attendance is not recorded on holiday dates</p>
          <button className="bg-[#F87171] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90">+ Add Holiday</button>
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
          <p className="text-4xl mb-4">🗓️</p>
          <p className="text-[#90A6BD] font-bold">No holidays added yet</p>
        </div>
      </div>
    </main>
  )
}

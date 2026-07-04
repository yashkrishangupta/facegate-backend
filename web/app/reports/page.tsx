export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Attendance Reports</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {["By Student", "By Batch", "By Subject", "By Room"].map((filter) => (
            <button key={filter} className="bg-[#1A2436] border border-[#2F4E73] rounded-xl p-4 text-[#90A6BD] text-sm font-bold hover:border-[#5DA9FF] hover:text-white transition-all">
              {filter}
            </button>
          ))}
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-[#90A6BD] font-bold">No attendance data yet</p>
        </div>
      </div>
    </main>
  )
}

export default function TodayPage() {
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Today Across All Rooms</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Sessions", value: "0", color: "#4ADE80" },
            { label: "Total Present", value: "0", color: "#5DA9FF" },
            { label: "Active Devices", value: "0", color: "#F59E0B" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1A2436] rounded-2xl p-5 border border-[#2F4E73]">
              <p style={{ color: stat.color }} className="text-3xl font-bold">{stat.value}</p>
              <p className="text-[#90A6BD] text-xs mt-1 font-bold tracking-wide uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
          <p className="text-4xl mb-4">🏫</p>
          <p className="text-[#90A6BD] font-bold">No active sessions right now</p>
          <p className="text-[#4A6080] text-sm mt-1">Live room status will appear here when sessions are running</p>
        </div>
      </div>
    </main>
  )
}

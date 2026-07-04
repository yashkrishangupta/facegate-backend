export default function DevicesPage() {
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Devices</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD]">Monitor all registered Android devices</p>
          <button className="bg-[#4ADE80] text-black font-bold px-6 py-3 rounded-xl hover:opacity-90">+ Register Device</button>
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
          <p className="text-4xl mb-4">📱</p>
          <p className="text-[#90A6BD] font-bold">No devices registered yet</p>
          <p className="text-[#4A6080] text-sm mt-1">Register an Android device to start syncing attendance</p>
        </div>
      </div>
    </main>
  )
}

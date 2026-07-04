export default function ConflictsPage() {
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Conflict Queue</h1>
        </div>
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-[#4ADE80] font-bold">No open conflicts</p>
          <p className="text-[#4A6080] text-sm mt-1">Ambiguous face matches will appear here for review</p>
        </div>
      </div>
    </main>
  )
}

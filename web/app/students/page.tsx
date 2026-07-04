export default function StudentsPage() {
  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Students</h1>
        </div>

        {/* Search + Add */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search students..."
            className="flex-1 bg-[#1A2436] border border-[#2F4E73] rounded-xl px-4 py-3 text-white placeholder-[#90A6BD] focus:outline-none focus:border-[#5DA9FF]"
          />
          <button className="bg-[#5DA9FF] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90">
            + Add Student
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2F4E73]">
                <th className="text-left p-4 text-[#90A6BD] text-sm font-bold">Roll No</th>
                <th className="text-left p-4 text-[#90A6BD] text-sm font-bold">Name</th>
                <th className="text-left p-4 text-[#90A6BD] text-sm font-bold">Batch</th>
                <th className="text-left p-4 text-[#90A6BD] text-sm font-bold">Status</th>
                <th className="text-left p-4 text-[#90A6BD] text-sm font-bold">Enrollment</th>
                <th className="text-left p-4 text-[#90A6BD] text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#90A6BD]">
                  No students found. Add your first student to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}

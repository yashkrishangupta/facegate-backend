'use client';

const students = [
  {
    name: "Rahul Sharma",
    course: "B.Tech CSE",
  },
  {
    name: "Priya Singh",
    course: "MBA",
  },
  {
    name: "Aman Gupta",
    course: "MCA",
  },
  {
    name: "Sneha Jain",
    course: "BCA",
  },
];

export default function LatestStudents() {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <h2 className="text-xl font-semibold text-white mb-5">
        Latest Enrollments
      </h2>

      <div className="space-y-4">

        {students.map((student) => (
          <div
            key={student.name}
            className="flex items-center justify-between bg-[#24324B] rounded-xl p-4"
          >

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                {student.name.charAt(0)}
              </div>

              <div>
                <p className="text-white font-medium">
                  {student.name}
                </p>

                <p className="text-sm text-slate-400">
                  {student.course}
                </p>
              </div>

            </div>

            <span className="text-xs text-green-400">
              New
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}
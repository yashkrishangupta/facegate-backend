'use client';

interface Props {
  name: string;
}

export default function WelcomeCard({ name }: Props) {
  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-8 shadow-xl">

      <p className="text-blue-100 text-sm">
        Welcome back 👋
      </p>

      <h1 className="text-3xl font-bold text-white mt-2">
        {name}
      </h1>

      <p className="text-blue-100 mt-3 max-w-lg">
        Manage attendance, students, devices and reports from a single dashboard.
      </p>

      <div className="flex gap-8 mt-8">

        <div>
          <p className="text-2xl font-bold">125</p>
          <p className="text-sm text-blue-100">
            Today's Attendance
          </p>
        </div>

        <div>
          <p className="text-2xl font-bold">4</p>
          <p className="text-sm text-blue-100">
            Pending Conflicts
          </p>
        </div>

        <div>
          <p className="text-2xl font-bold">8</p>
          <p className="text-sm text-blue-100">
            Active Rooms
          </p>
        </div>

      </div>

    </div>
  );
}
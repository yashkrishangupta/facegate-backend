'use client';

const rooms = [
  { name: "Room A101", value: 98 },
  { name: "Room B203", value: 95 },
  { name: "Room C105", value: 92 },
  { name: "Room D401", value: 89 },
];

export default function TopRooms() {
  return (
    <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 mt-8">

      <h2 className="text-xl font-semibold text-white mb-6">
        Top Performing Rooms
      </h2>

      <div className="space-y-5">

        {rooms.map((room) => (
          <div key={room.name}>

            <div className="flex justify-between mb-2">

              <span className="text-white">
                {room.name}
              </span>

              <span className="text-blue-400 font-semibold">
                {room.value}%
              </span>

            </div>

            <div className="w-full bg-[#24324B] rounded-full h-3">

              <div
                className="bg-blue-500 h-3 rounded-full"
                style={{ width: `${room.value}%` }}
              />

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
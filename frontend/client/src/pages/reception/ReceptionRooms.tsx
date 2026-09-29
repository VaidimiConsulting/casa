import { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import { BedDouble, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import api from "@/api/axios";

interface Room {
  id: number;
  name: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  status: "available" | "unavailable";
  image: string | null;
}

export default function ReceptionRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      const res = await api.get("/rooms");
      setRooms(res.data.rooms || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(room: Room) {
    setUpdating(room.id);
    try {
      const newStatus = room.status === "available" ? "unavailable" : "available";
      await api.put(`/rooms/${room.id}`, { ...room, status: newStatus });
      setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const available = rooms.filter((r) => r.status === "available").length;
  const occupied = rooms.filter((r) => r.status === "unavailable").length;

  return (
    <ReceptionLayout
      title="Room Status"
      subtitle="View and update room availability"
      actions={
        <button onClick={fetchRooms} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl p-4 text-center">
          <p className="text-3xl font-serif font-bold text-[#20352b]">{rooms.length}</p>
          <p className="text-[11px] font-mono uppercase text-[#77766c] mt-1">Total Rooms</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-serif font-bold text-green-700">{available}</p>
          <p className="text-[11px] font-mono uppercase text-green-600 mt-1">Available</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-serif font-bold text-red-700">{occupied}</p>
          <p className="text-[11px] font-mono uppercase text-red-600 mt-1">Occupied / Unavailable</p>
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#77766c] text-sm">Loading rooms...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`bg-[#fbf8f1] border rounded-2xl overflow-hidden transition-all ${
                room.status === "available" ? "border-green-200" : "border-red-200"
              }`}
            >
              {room.image && (
                <div className="h-36 overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-[#20352b]">{room.name}</h3>
                    <p className="text-[11px] text-[#77766c]">{room.room_type} · {room.capacity} guests</p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-1 rounded-full font-semibold ${
                    room.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {room.status === "available" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {room.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#20352b] mb-3">₹{Number(room.price_per_night).toLocaleString("en-IN")}<span className="text-[11px] font-normal text-[#77766c]">/night</span></p>
                <button
                  onClick={() => toggleStatus(room)}
                  disabled={updating === room.id}
                  className={`w-full py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 ${
                    room.status === "available"
                      ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                      : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  }`}
                >
                  {updating === room.id ? "Updating..." : room.status === "available" ? "Mark Unavailable" : "Mark Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ReceptionLayout>
  );
}

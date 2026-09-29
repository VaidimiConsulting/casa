import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { CheckCircle2, LogOut, RefreshCw, Search, UserCheck } from "lucide-react";
import api from "@/api/axios";

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_amount: number;
  notes: string;
}

export default function CheckIn() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"checkin" | "checkout">("checkin");
  const [updating, setUpdating] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: number, status: string) {
    setUpdating(id);
    try {
      await api.put(`/bookings/${id}`, { status });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const todayCheckIns = bookings.filter(
    (b) => b.check_in?.startsWith(today) && (b.status === "pending" || b.status === "confirmed")
  );
  const todayCheckOuts = bookings.filter(
    (b) => b.check_out?.startsWith(today) && b.status === "confirmed"
  );

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_phone?.includes(search);
    if (!matchSearch) return false;
    if (tab === "checkin") return b.status === "pending" || b.status === "confirmed";
    if (tab === "checkout") return b.status === "confirmed";
    return true;
  });

  return (
    <AdminLayout
      title="Check-In & Check-Out Desk"
      subtitle="Manage guest arrivals, departures and live room occupancies"
      actions={
        <button
          onClick={fetchBookings}
          className="button button-quiet px-3.5 py-2 text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Today's KPI Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-[#20352b]">
                {todayCheckIns.length}
              </div>
              <div className="text-xs text-[#77766c]">Arrivals Scheduled Today</div>
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <LogOut size={24} />
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-[#20352b]">
                {todayCheckOuts.length}
              </div>
              <div className="text-xs text-[#77766c]">Departures Scheduled Today</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex rounded-2xl bg-[#efe8dc] p-1 gap-1">
            <button
              onClick={() => setTab("checkin")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === "checkin"
                  ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                  : "text-[#77766c] hover:text-[#20352b]"
              }`}
            >
              Arrivals / Check-In ({todayCheckIns.length} today)
            </button>
            <button
              onClick={() => setTab("checkout")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === "checkout"
                  ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                  : "text-[#77766c] hover:text-[#20352b]"
              }`}
            >
              Departures / Check-Out ({todayCheckOuts.length} today)
            </button>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search guest name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#77766c]">Loading guest records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#77766c]">
              No {tab === "checkin" ? "check-in" : "check-out"} records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#efe8dc]/50 text-[#77766c] font-mono uppercase text-[10px] tracking-wider border-b border-[#20352b]/10">
                  <tr>
                    <th className="px-5 py-3.5">Guest</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Dates</th>
                    <th className="px-4 py-3.5">Guests</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Desk Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20352b]/5">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-[#efe8dc]/20 transition-colors">
                      <td className="px-5 py-4 font-medium text-[#20352b]">{b.guest_name}</td>
                      <td className="px-4 py-4 text-[#77766c]">
                        <div>{b.guest_email}</div>
                        {b.guest_phone && (
                          <div className="text-[11px] text-[#20352b]/60">{b.guest_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-[#20352b]">
                        <div>In: {b.check_in?.split("T")[0]}</div>
                        <div>Out: {b.check_out?.split("T")[0]}</div>
                      </td>
                      <td className="px-4 py-4 text-[#20352b]">{b.guests}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase font-mono ${
                            b.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : b.status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {successId === b.id ? (
                          <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                            <CheckCircle2 size={14} /> Updated!
                          </span>
                        ) : tab === "checkin" ? (
                          b.status === "pending" ? (
                            <button
                              onClick={() => handleAction(b.id, "confirmed")}
                              disabled={updating === b.id}
                              className="button button-dark px-3 py-1.5 text-xs inline-flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>{updating === b.id ? "..." : "Check In Guest"}</span>
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-medium text-[11px]">
                              Checked In
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleAction(b.id, "completed")}
                            disabled={updating === b.id}
                            className="px-3 py-1.5 rounded-xl border border-[#20352b]/20 hover:bg-[#20352b] hover:text-white transition-all text-xs inline-flex items-center gap-1 font-semibold"
                          >
                            <LogOut size={13} />
                            <span>{updating === b.id ? "..." : "Complete Check-Out"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

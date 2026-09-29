import { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import { CheckCircle2, LogOut, RefreshCw, Search } from "lucide-react";
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

export default function ReceptionCheckIn() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"checkin" | "checkout">("checkin");
  const [updating, setUpdating] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { fetchBookings(); }, []);

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
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
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

  const list = tab === "checkin" ? todayCheckIns : todayCheckOuts;
  const filtered = list.filter(
    (b) =>
      b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_phone?.includes(search)
  );

  return (
    <ReceptionLayout
      title="Check-In / Check-Out"
      subtitle={`Today: ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}
      actions={
        <button onClick={fetchBookings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("checkin")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all ${
            tab === "checkin"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-[#fbf8f1] text-[#77766c] border border-[#20352b]/15 hover:text-[#20352b]"
          }`}
        >
          <CheckCircle2 size={14} />
          Check-In ({todayCheckIns.length})
        </button>
        <button
          onClick={() => setTab("checkout")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all ${
            tab === "checkout"
              ? "bg-[#20352b] text-white shadow-sm"
              : "bg-[#fbf8f1] text-[#77766c] border border-[#20352b]/15 hover:text-[#20352b]"
          }`}
        >
          <LogOut size={14} />
          Check-Out ({todayCheckOuts.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
        <input
          type="text"
          placeholder="Search by guest name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] transition-all"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-[#77766c] text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl p-10 text-center">
          <p className="font-serif text-lg text-[#20352b] mb-1">
            {tab === "checkin" ? "No Check-Ins Today" : "No Check-Outs Today"}
          </p>
          <p className="text-xs text-[#77766c]">
            {tab === "checkin" ? "No guests arriving today." : "No guests departing today."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className={`bg-[#fbf8f1] border rounded-2xl p-5 transition-all ${
                successId === b.id ? "border-green-400 bg-green-50" : "border-[#20352b]/10"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-serif font-semibold text-[#20352b]">{b.guest_name}</h3>
                  <p className="text-[11px] text-[#77766c]">{b.guest_email}</p>
                  {b.guest_phone && <p className="text-[11px] text-[#77766c]">{b.guest_phone}</p>}
                </div>
                <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-semibold ${
                  b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}>
                  {b.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#77766c] mb-4 bg-[#f5f0e8]/60 rounded-xl p-3">
                <div><span className="font-mono uppercase text-[10px]">Check-In</span><p className="text-[#20352b] font-medium mt-0.5">{new Date(b.check_in).toLocaleDateString("en-IN")}</p></div>
                <div><span className="font-mono uppercase text-[10px]">Check-Out</span><p className="text-[#20352b] font-medium mt-0.5">{new Date(b.check_out).toLocaleDateString("en-IN")}</p></div>
                <div><span className="font-mono uppercase text-[10px]">Guests</span><p className="text-[#20352b] font-medium mt-0.5">{b.guests}</p></div>
                <div><span className="font-mono uppercase text-[10px]">Amount</span><p className="text-[#20352b] font-medium mt-0.5">₹{Number(b.total_amount).toLocaleString("en-IN")}</p></div>
              </div>
              {b.notes && <p className="text-[11px] text-[#77766c] mb-3 italic">"{b.notes}"</p>}
              {tab === "checkin" ? (
                <button
                  onClick={() => handleAction(b.id, "confirmed")}
                  disabled={updating === b.id || b.status === "confirmed"}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 bg-green-600 text-white hover:bg-green-700"
                >
                  {updating === b.id ? "Processing..." : successId === b.id ? "✓ Checked In!" : b.status === "confirmed" ? "Already Checked In" : "Confirm Check-In"}
                </button>
              ) : (
                <button
                  onClick={() => handleAction(b.id, "completed")}
                  disabled={updating === b.id}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 bg-[#20352b] text-white hover:bg-[#2a4535]"
                >
                  {updating === b.id ? "Processing..." : successId === b.id ? "✓ Checked Out!" : "Confirm Check-Out"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </ReceptionLayout>
  );
}

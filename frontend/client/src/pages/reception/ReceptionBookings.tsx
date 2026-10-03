import { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import Modal from "@/components/admin/Modal";
import BookingInvoiceModal from "@/components/BookingInvoiceModal";
import { Search, RefreshCw, Plus, CalendarDays, BedDouble, UserCheck, IndianRupee, Receipt, Printer } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_id: number | null;
  room_name?: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  completed: "bg-gray-100 text-gray-600",
};

export default function ReceptionBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<any | null>(null);

  // New Walk-in Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [walkinForm, setWalkinForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    room_id: 1,
    check_in: todayStr,
    check_out: tomorrowStr,
    guests: 2,
    notes: "Walk-in Guest registered at front desk",
  });

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRooms() {
    try {
      const res = await api.get("/rooms");
      const r = res.data.rooms || res.data || [];
      setRooms(r);
      if (r.length > 0) {
        setWalkinForm((prev) => ({ ...prev, room_id: r[0].id }));
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      await api.put(`/bookings/${id}`, { status });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success(`Booking status changed to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  const handleCreateWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.guest_name.trim()) {
      toast.error("Guest name is required.");
      return;
    }
    if (!walkinForm.guest_email.trim()) {
      toast.error("Guest email is required.");
      return;
    }

    try {
      await api.post("/bookings", walkinForm);
      toast.success("Walk-in booking created successfully!");
      setIsModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create walk-in booking.");
    }
  };

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_phone?.includes(search) ||
      b.room_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <ReceptionLayout
      title="Bookings & Reservations"
      subtitle="Front desk reservation pipeline, stay dates, and walk-in arrivals"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c8a36a] text-[#20352b] text-xs font-semibold hover:bg-[#b59259] transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Walk-in Booking</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Total Stays</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{bookings.length}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block mb-1">Confirmed</span>
            <span className="text-2xl font-serif font-bold text-emerald-800">
              {bookings.filter((b) => b.status === "confirmed").length}
            </span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-amber-700 block mb-1">Pending</span>
            <span className="text-2xl font-serif font-bold text-amber-800">
              {bookings.filter((b) => b.status === "pending").length}
            </span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Completed</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">
              {bookings.filter((b) => b.status === "completed").length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search guest name, email, phone or suite..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-xs text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-xs text-[#20352b] focus:outline-none transition-all"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="text-center py-16 text-[#77766c] text-xs">Loading reservations...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#77766c]">
              <CalendarDays size={36} className="mx-auto opacity-40 mb-2" />
              <p className="font-serif text-base text-[#20352b]">No Bookings Found</p>
              <p className="text-xs">No records matched your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f0e8]/80 border-b border-[#20352b]/10 text-[10px] uppercase font-mono tracking-wider text-[#77766c]">
                  <tr>
                    <th className="px-5 py-3">Guest Details</th>
                    <th className="px-5 py-3">Room / Suite</th>
                    <th className="px-5 py-3">Check-In</th>
                    <th className="px-5 py-3">Check-Out</th>
                    <th className="px-5 py-3">Total Fare</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20352b]/8">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f5f0e8]/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#20352b] text-sm">{b.guest_name}</p>
                        <p className="text-[11px] text-[#77766c]">{b.guest_phone || "No phone"} • {b.guest_email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-[#20352b] block">{b.room_name || "Assigned Suite"}</span>
                        <span className="text-[10px] text-[#77766c]">{b.guests} guest(s)</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[#20352b]">
                        {b.check_in ? new Date(b.check_in).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#20352b]">
                        {b.check_out ? new Date(b.check_out).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-[#20352b]">
                        ₹{Number(b.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-semibold ${
                            STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvoiceBooking(b)}
                            className="p-1.5 rounded-lg text-[#c8a36a] hover:bg-[#c8a36a]/15 transition-colors inline-flex items-center gap-1 border border-[#c8a36a]/30"
                            title="Print & Download Booking Slip (PDF)"
                          >
                            <Receipt size={13} />
                            <span className="text-[10px] font-bold">Voucher</span>
                          </button>
                          <select
                            value={b.status}
                            onChange={(e) => updateStatus(b.id, e.target.value)}
                            disabled={updating === b.id}
                            className="text-xs border border-[#20352b]/15 rounded-xl px-2.5 py-1.5 bg-[#f5f0e8] text-[#20352b] focus:outline-none disabled:opacity-50"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Walk-in Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Walk-in Guest Reservation"
      >
        <form onSubmit={handleCreateWalkin} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Guest Full Name *</label>
              <input
                type="text"
                required
                value={walkinForm.guest_name}
                onChange={(e) => setWalkinForm({ ...walkinForm, guest_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="e.g. Priya Nair"
              />
            </div>
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={walkinForm.guest_phone}
                onChange={(e) => setWalkinForm({ ...walkinForm, guest_phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="e.g. 9845012345"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Guest Email *</label>
            <input
              type="email"
              required
              value={walkinForm.guest_email}
              onChange={(e) => setWalkinForm({ ...walkinForm, guest_email: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="e.g. priya@gmail.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Room / Suite *</label>
              <select
                value={walkinForm.room_id}
                onChange={(e) => setWalkinForm({ ...walkinForm, room_id: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (₹{r.price_per_night}/night)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Number of Guests</label>
              <input
                type="number"
                min="1"
                max="8"
                value={walkinForm.guests}
                onChange={(e) => setWalkinForm({ ...walkinForm, guests: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Check-In Date *</label>
              <input
                type="date"
                required
                value={walkinForm.check_in}
                onChange={(e) => setWalkinForm({ ...walkinForm, check_in: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Check-Out Date *</label>
              <input
                type="date"
                required
                value={walkinForm.check_out}
                onChange={(e) => setWalkinForm({ ...walkinForm, check_out: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Notes / Special Requests</label>
            <input
              type="text"
              value={walkinForm.notes}
              onChange={(e) => setWalkinForm({ ...walkinForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="e.g. Ground floor preferred"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Confirm Walk-in Stay
            </button>
          </div>
        </form>
      </Modal>

      <BookingInvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={!!selectedInvoiceBooking}
        onClose={() => setSelectedInvoiceBooking(null)}
      />
    </ReceptionLayout>
  );
}

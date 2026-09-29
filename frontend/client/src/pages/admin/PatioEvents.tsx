import React, { useEffect, useState } from "react";
import {
  PartyPopper,
  Calendar,
  Clock,
  Users,
  Utensils,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Search,
  Check,
  X,
  FileText,
  Printer,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  DollarSign,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import {
  fetchPatioBookings,
  updatePatioBookingStatus,
  updatePatioPayment,
  deletePatioBooking,
  PatioBooking,
} from "@/api/patio";
import { toast } from "sonner";

export default function PatioEvents() {
  const [bookings, setBookings] = useState<PatioBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit / Quote Modal
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<PatioBooking | null>(null);
  const [editStatus, setEditStatus] = useState("confirmed");
  const [editQuote, setEditQuote] = useState<number>(0);
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Payment Modal
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<PatioBooking | null>(null);
  const [payStatus, setPayStatus] = useState("advance_paid");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("Cash at Front Desk");
  const [savingPay, setSavingPay] = useState(false);

  // Voucher / Receipt Modal
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<PatioBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await fetchPatioBookings();
      setBookings(data);
    } catch (error) {
      console.error("Failed to load patio bookings:", error);
      toast.error("Patio bookings data load nahi ho paya.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBookings();
  };

  const handleOpenEdit = (b: PatioBooking) => {
    setSelectedBookingForEdit(b);
    setEditStatus(b.status);
    setEditQuote(Number(b.final_quote_amount || b.estimated_total));
    setEditNotes(b.special_requests || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForEdit) return;

    try {
      setSavingEdit(true);
      await updatePatioBookingStatus(selectedBookingForEdit.id, {
        status: editStatus,
        final_quote_amount: editQuote,
        notes: editNotes,
      });
      toast.success(`Booking ${selectedBookingForEdit.booking_ref} status updated.`);
      setSelectedBookingForEdit(null);
      loadBookings();
    } catch (error) {
      console.error(error);
      toast.error("Booking update karne me error aaya.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenPayment = (b: PatioBooking) => {
    setSelectedBookingForPayment(b);
    setPayStatus(b.payment_status === "paid" ? "paid" : "advance_paid");
    setAdvanceAmount(Number(b.advance_paid || Math.round(Number(b.final_quote_amount || b.estimated_total) * 0.4)));
    setPayMethod(b.payment_method || "Cash at Front Desk");
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    try {
      setSavingPay(true);
      await updatePatioPayment(selectedBookingForPayment.id, {
        payment_status: payStatus,
        advance_paid: advanceAmount,
        payment_method: payMethod,
      });
      toast.success(`Payment updated for ${selectedBookingForPayment.booking_ref}.`);
      setSelectedBookingForPayment(null);
      loadBookings();
    } catch (error) {
      console.error(error);
      toast.error("Payment update karne me problem aayi.");
    } finally {
      setSavingPay(false);
    }
  };

  const handleDelete = async (b: PatioBooking) => {
    if (!window.confirm(`Kya aap booking ${b.booking_ref} (${b.host_name}) ko delete karna chahte hain?`)) {
      return;
    }

    try {
      await deletePatioBooking(b.id);
      toast.success("Patio booking record delete ho gaya.");
      setBookings(bookings.filter((item) => item.id !== b.id));
    } catch (error) {
      console.error(error);
      toast.error("Delete karne me error aaya.");
    }
  };

  // Metrics
  const totalEvents = bookings.length;
  const confirmedEvents = bookings.filter((b) => b.status === "confirmed");
  const pendingEvents = bookings.filter((b) => b.status === "pending");
  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.final_quote_amount || b.estimated_total || 0), 0);

  // Filtered List
  const filteredBookings = bookings.filter((b) => {
    if (activeTab !== "all" && b.status !== activeTab) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        b.host_name.toLowerCase().includes(q) ||
        b.host_phone.toLowerCase().includes(q) ||
        b.host_email.toLowerCase().includes(q) ||
        b.booking_ref.toLowerCase().includes(q) ||
        b.event_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout
      title="Open Patio & Small Events"
      subtitle="Manage 30–40 guest rooftop patio celebrations: Dinner parties, family gatherings, corporate mixers & birthdays"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="button button-light border border-[#20352b]/15 px-3 py-2 text-xs flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCcw size={14} className={isRefreshing ? "animate-spin text-[#20352b]" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-[#77766c] block">
              Total Patio Enquiries
            </span>
            <div className="text-2xl font-serif font-bold text-[#20352b] mt-1">
              {totalEvents} Events
            </div>
            <span className="text-[11px] text-[#77766c] mt-0.5 block">Small celebrations logged</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-emerald-800 block">
              Confirmed Celebrations
            </span>
            <div className="text-2xl font-serif font-bold text-emerald-950 mt-1">
              {confirmedEvents.length} Confirmed
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Approved & scheduled</span>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/70 shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-amber-800 block">
              Pending Quote Enquiries
            </span>
            <div className="text-2xl font-serif font-bold text-amber-950 mt-1">
              {pendingEvents.length} Awaiting Action
            </div>
            <span className="text-[11px] text-amber-700 mt-0.5 block">Review & confirm quote</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#20352b] text-white shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-[#f6d79e] block">
              Total Quoted Revenue
            </span>
            <div className="text-2xl font-serif font-bold text-white mt-1">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-white/80 mt-0.5 block">Patio events pipeline</span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white p-4 rounded-2xl border border-[#20352b]/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "all" ? "bg-[#20352b] text-white" : "bg-[#f5f0e8] text-[#20352b] hover:bg-[#eae4d8]"
              }`}
            >
              All Events ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              Pending ({pendingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("confirmed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "confirmed"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              Confirmed ({confirmedEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "completed" ? "bg-[#20352b] text-white" : "bg-[#f5f0e8] text-[#20352b]"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "cancelled" ? "bg-red-700 text-white" : "bg-red-50 text-red-700"
              }`}
            >
              Cancelled
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search host, phone, ref, event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-xl text-xs text-[#20352b] placeholder-[#77766c] focus:outline-none focus:border-[#20352b]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-[#20352b]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#20352b]">
              <thead>
                <tr className="bg-[#f5f0e8]/70 border-b border-[#20352b]/10 font-mono text-[10px] uppercase text-[#77766c] tracking-wider">
                  <th className="py-3.5 px-4">Ref #</th>
                  <th className="py-3.5 px-4">Host Details</th>
                  <th className="py-3.5 px-4">Event & Date</th>
                  <th className="py-3.5 px-4">Time Slot & Guests</th>
                  <th className="py-3.5 px-4">Food & Menu</th>
                  <th className="py-3.5 px-4">Quoted Total</th>
                  <th className="py-3.5 px-4">Status & Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20352b]/5">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77766c]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCcw size={20} className="animate-spin text-[#20352b]" />
                        <span>Patio event bookings load ho rahi hain...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77766c]">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <PartyPopper size={32} className="text-[#c8a36a]" />
                        <p className="font-medium text-sm text-[#20352b]">Koi patio booking nahi mili</p>
                        <p className="text-xs text-[#77766c]">
                          Website ke &quot;Open Patio&quot; section se aane wali bookings yahan display hongi.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const isConfirmed = b.status === "confirmed";
                    const isPending = b.status === "pending";
                    const isPaid = b.payment_status === "paid";
                    const isAdvance = b.payment_status === "advance_paid";

                    return (
                      <tr key={b.id} className="hover:bg-[#fbf8f1] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#20352b]">
                          {b.booking_ref}
                          <span className="text-[10px] text-[#77766c] block font-normal">
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-[#20352b]">{b.host_name}</div>
                          <div className="text-[11px] text-[#77766c] flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone size={11} /> {b.host_phone}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#77766c]">{b.host_email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#f5f0e8] text-[#20352b] font-semibold text-[11px] border border-[#20352b]/10 mb-1">
                            {b.event_type}
                          </span>
                          <div className="text-[11px] font-medium text-[#20352b] flex items-center gap-1">
                            <Calendar size={11} className="text-[#c8a36a]" />
                            {new Date(b.event_date).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#20352b]">{b.time_slot}</div>
                          <div className="text-[11px] text-[#77766c] flex items-center gap-1 mt-0.5">
                            <Users size={12} />
                            <strong>{b.guest_count} Guests</strong> (Capacity 30-40)
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#20352b] flex items-center gap-1">
                            <Utensils size={12} className="text-[#c8a36a]" />
                            {b.food_menu_type}
                          </div>
                          {b.special_requests && (
                            <div className="text-[10px] text-[#77766c] italic line-clamp-1 mt-0.5 max-w-[180px]">
                              &quot;{b.special_requests}&quot;
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {Number(b.final_quote_amount || b.estimated_total) > 0 ? (
                            <div>
                              <span className="font-bold text-sm text-[#20352b] block">
                                ₹{Number(b.final_quote_amount || b.estimated_total).toLocaleString()}
                              </span>
                              {b.advance_paid > 0 && (
                                <span className="text-[10px] text-emerald-700 block font-normal">
                                  Adv: ₹{Number(b.advance_paid).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold font-sans transition-colors shadow-2xs"
                              title="Click to set event rate"
                            >
                              Set Event Rate ✍️
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 space-y-1">
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              <CheckCircle2 size={11} /> Confirmed
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              <Clock size={11} /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-semibold">
                              {b.status}
                            </span>
                          )}

                          <div>
                            {isPaid ? (
                              <span className="text-[10px] font-semibold text-emerald-700 block">
                                ✅ Paid in Full
                              </span>
                            ) : isAdvance ? (
                              <span className="text-[10px] font-semibold text-blue-700 block">
                                💳 Advance Received
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 block">
                                ⏳ Payment Due
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBookingForVoucher(b)}
                              className="px-2.5 py-1 rounded-lg bg-[#20352b] text-[#fbf8f1] hover:bg-[#20352b]/90 text-[11px] font-medium flex items-center gap-1 shadow-xs"
                              title="View & Download Event Slip"
                            >
                              <FileText size={12} className="text-[#c8a36a]" />
                              <span>Slip</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#20352b]/15 text-[#20352b] hover:bg-[#f5f0e8] text-[11px] font-medium flex items-center gap-1"
                              title="Update Quote & Status"
                            >
                              <Edit size={11} />
                              <span>Quote</span>
                            </button>

                            <button
                              onClick={() => handleOpenPayment(b)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1"
                              title="Record Advance or Full Payment"
                            >
                              <DollarSign size={11} />
                              <span>Pay</span>
                            </button>

                            <button
                              onClick={() => handleDelete(b)}
                              className="p-1 text-red-600 hover:text-red-700 rounded-md"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Quote & Status Modal */}
      <Modal
        isOpen={Boolean(selectedBookingForEdit)}
        onClose={() => setSelectedBookingForEdit(null)}
        title="Event Quotation & Status"
        subtitle={`Booking Ref: ${selectedBookingForEdit?.booking_ref}`}
        maxWidth="sm"
      >
        {selectedBookingForEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="p-3 bg-[#f5f0e8] rounded-xl text-[#20352b] space-y-1">
              <div className="font-semibold">{selectedBookingForEdit.host_name}</div>
              <div className="text-[11px] text-[#77766c]">
                {selectedBookingForEdit.event_type} • {selectedBookingForEdit.guest_count} Guests
              </div>
              <div className="text-[11px] text-[#77766c]">
                Food/Catering: <strong>{selectedBookingForEdit.food_menu_type}</strong>
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Event Booking Rate / Quotation (₹) *
              </label>
              <input
                type="number"
                value={editQuote}
                onChange={(e) => setEditQuote(Number(e.target.value))}
                required
                placeholder="Enter agreed total event price in ₹"
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] font-semibold focus:outline-none focus:border-[#20352b]"
              />
              <span className="text-[10px] text-[#77766c] mt-0.5 block">
                Admin decides the total price for venue, food catering, and services.
              </span>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Booking Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="pending">Pending Enquiry ⏳</option>
                <option value="confirmed">Confirmed Celebration ✅</option>
                <option value="completed">Event Completed 🏆</option>
                <option value="cancelled">Cancelled ❌</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Special Requests / Staff Notes
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Fairy lights, sound system, specific cake table setup..."
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForEdit(null)}
                className="button button-light border border-[#20352b]/15 px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingEdit} className="button button-dark px-5 py-2">
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payment Settlement Modal */}
      <Modal
        isOpen={Boolean(selectedBookingForPayment)}
        onClose={() => setSelectedBookingForPayment(null)}
        title="Event Payment Settlement"
        subtitle={`Booking Ref: ${selectedBookingForPayment?.booking_ref}`}
        maxWidth="sm"
      >
        {selectedBookingForPayment && (
          <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold block">
                  Total Quoted
                </span>
                <span className="text-lg font-serif font-bold">
                  ₹{Number(selectedBookingForPayment.final_quote_amount || selectedBookingForPayment.estimated_total).toLocaleString()}
                </span>
              </div>
              <div className="text-right text-[11px] text-emerald-800">
                {selectedBookingForPayment.host_name}
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Payment Status *
              </label>
              <select
                value={payStatus}
                onChange={(e) => setPayStatus(e.target.value)}
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="advance_paid">Advance Deposit Received 💳</option>
                <option value="paid">Fully Settled / Paid ✅</option>
                <option value="pending">Pending Payment ⏳</option>
                <option value="refunded">Refunded ↩️</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                required
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="Cash at Front Desk">Cash at Front Desk</option>
                <option value="UPI / QR Code">UPI / QR Code</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Net Banking">Net Banking Transfer</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForPayment(null)}
                className="button button-light border border-[#20352b]/15 px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingPay} className="button button-dark px-5 py-2">
                {savingPay ? "Updating..." : "Update Payment"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Official Event Voucher Modal */}
      {selectedBookingForVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:w-full">
            <div className="flex items-center justify-between px-6 py-4 bg-[#20352b] text-[#fbf8f1] print:hidden">
              <div className="flex items-center gap-2">
                <PartyPopper size={18} className="text-[#c8a36a]" />
                <span className="font-serif font-bold text-sm tracking-wide">
                  Open Patio Event Confirmation Slip
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-full bg-[#c8a36a] text-[#20352b] hover:bg-[#d8b57d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={13} />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForVoucher(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 space-y-6 text-[#20352b]">
              <div className="flex items-start justify-between border-b border-[#20352b]/15 pb-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#20352b]">Casa Nest Homestay</h3>
                  <p className="text-xs text-[#77766c] mt-0.5">Open Patio & Rooftop Terrace Events</p>
                  <p className="text-xs text-[#77766c]">Assi Ghat Road, Varanasi, Uttar Pradesh</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] uppercase tracking-wider text-[#77766c] block">
                    Event Reference
                  </span>
                  <strong className="text-base text-[#20352b] block">
                    {selectedBookingForVoucher.booking_ref}
                  </strong>
                  <span className="text-[11px] text-[#77766c]">
                    Date: {new Date(selectedBookingForVoucher.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Host & Event Details */}
              <div className="grid grid-cols-2 gap-4 bg-[#f5f0e8] p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#77766c] block">Host Name</span>
                  <strong className="text-sm text-[#20352b]">{selectedBookingForVoucher.host_name}</strong>
                  <div className="text-[#77766c] mt-0.5">{selectedBookingForVoucher.host_phone}</div>
                  <div className="text-[#77766c]">{selectedBookingForVoucher.host_email}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#77766c] block">Event Details</span>
                  <strong className="text-sm text-[#20352b]">{selectedBookingForVoucher.event_type}</strong>
                  <div className="text-[#77766c] mt-0.5">
                    Date: <strong>{new Date(selectedBookingForVoucher.event_date).toLocaleDateString()}</strong>
                  </div>
                  <div className="text-[#77766c]">Slot: {selectedBookingForVoucher.time_slot}</div>
                  <div className="text-[#77766c]">Capacity: {selectedBookingForVoucher.guest_count} Guests</div>
                </div>
              </div>

              {/* Menu Package & Pricing */}
              <div className="border border-[#20352b]/15 rounded-2xl overflow-hidden text-xs">
                <div className="bg-[#f5f0e8] px-4 py-2.5 font-mono text-[10px] uppercase text-[#77766c] font-bold border-b border-[#20352b]/15 flex justify-between">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Open Patio Venue Access ({selectedBookingForVoucher.time_slot})</span>
                    <span className="font-mono">
                      ₹{Number(selectedBookingForVoucher.base_venue_price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Catering & Menu: {selectedBookingForVoucher.food_menu_type} ({selectedBookingForVoucher.guest_count} × ₹{Number(selectedBookingForVoucher.food_price_per_head)})
                    </span>
                    <span className="font-mono">
                      ₹{(Number(selectedBookingForVoucher.food_price_per_head) * selectedBookingForVoucher.guest_count).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#20352b]/10 flex justify-between font-bold text-sm">
                    <span>Total Quoted Amount</span>
                    <span className="font-mono">
                      ₹{Number(selectedBookingForVoucher.final_quote_amount || selectedBookingForVoucher.estimated_total).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 text-xs font-semibold">
                    <span>Advance Received ({selectedBookingForVoucher.payment_method})</span>
                    <span className="font-mono">
                      ₹{Number(selectedBookingForVoucher.advance_paid).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-800 text-xs font-semibold">
                    <span>Balance Due at Event</span>
                    <span className="font-mono">
                      ₹{Math.max(0, Number(selectedBookingForVoucher.final_quote_amount || selectedBookingForVoucher.estimated_total) - Number(selectedBookingForVoucher.advance_paid)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#77766c] border-t border-[#20352b]/10 pt-4 flex justify-between items-center">
                <span>Casa Nest Authorized Signature</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  Status: {selectedBookingForVoucher.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

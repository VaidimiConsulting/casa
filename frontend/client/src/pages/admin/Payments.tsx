import React, { useEffect, useState } from "react";
import {
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  RefreshCcw,
  DollarSign,
  FileText,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  Building,
  BedDouble,
  Receipt,
  Download,
  Printer,
  Sparkles,
  Wallet,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import BookingInvoiceModal from "@/components/BookingInvoiceModal";
import {
  fetchPayments,
  createPayment,
  updatePaymentStatus,
  updateBookingPaymentStatus,
  Payment,
} from "@/api/payments";
import { Booking } from "@/api/bookings";
import { toast } from "sonner";

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedPaymentForCollect, setSelectedPaymentForCollect] = useState<Payment | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  // Record Payment Form State
  const [formData, setFormData] = useState<Partial<Payment>>({
    booking_id: undefined,
    customer_name: "",
    amount: 0,
    payment_method: "Cash",
    transaction_id: "",
    status: "paid",
  });

  // Collect Modal Form State
  const [collectMethod, setCollectMethod] = useState("Cash at Desk");
  const [collectTxnId, setCollectTxnId] = useState("");
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchPayments();
      setPayments(data || []);
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast.error("Payments data load nahi ho paya. Refresh karke dobara try karein.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPayments();
  };

  const handleOpenAdd = () => {
    setFormData({
      booking_id: undefined,
      customer_name: "",
      amount: 4500,
      payment_method: "Cash",
      transaction_id: `REC-${Date.now().toString().slice(-6)}`,
      status: "paid",
    });
    setIsRecordModalOpen(true);
  };

  const handleSubmitNewPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Kripya valid payment amount daalein.");
      return;
    }

    try {
      await createPayment(formData);
      toast.success("Payment entry successfully record ho gayi!");
      setIsRecordModalOpen(false);
      loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Payment record karne me error aaya.");
    }
  };

  const handleOpenCollect = (p: Payment) => {
    setSelectedPaymentForCollect(p);
    setCollectMethod("Cash at Desk");
    setCollectTxnId(`DESK-${Date.now().toString().slice(-6)}`);
    setIsCollectModalOpen(true);
  };

  const handleConfirmCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForCollect) return;

    try {
      setCollecting(true);
      if (selectedPaymentForCollect.booking_id) {
        await updateBookingPaymentStatus(
          selectedPaymentForCollect.booking_id,
          "paid",
          collectMethod
        );
      } else if (selectedPaymentForCollect.id > 0) {
        await updatePaymentStatus(selectedPaymentForCollect.id, "paid");
      }
      toast.success(
        `Payment mark as PAID! ₹${(selectedPaymentForCollect.total_amount || selectedPaymentForCollect.amount).toLocaleString()} receive ho chuka hai.`
      );
      setIsCollectModalOpen(false);
      setSelectedPaymentForCollect(null);
      loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Payment update karne me problem aayi.");
    } finally {
      setCollecting(false);
    }
  };

  const handleStatusChange = async (payment: Payment, newStatus: string) => {
    try {
      if (payment.booking_id) {
        await updateBookingPaymentStatus(payment.booking_id, newStatus);
      } else if (payment.id > 0) {
        await updatePaymentStatus(payment.id, newStatus);
      }
      toast.success(`Payment status बदलकर "${newStatus.toUpperCase()}" कर दिया गया.`);
      loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Payment status update nahi ho paya.");
    }
  };

  const handleViewInvoice = (p: Payment) => {
    const validBookingStatus: "pending" | "confirmed" | "cancelled" | "completed" =
      p.booking_status === "pending" ||
      p.booking_status === "confirmed" ||
      p.booking_status === "cancelled" ||
      p.booking_status === "completed"
        ? p.booking_status
        : "confirmed";

    const bookingData: Booking = {
      id: p.booking_id || p.id,
      user_id: null,
      room_id: null,
      guest_name: p.guest_name || p.customer_name || "Guest User",
      guest_email: p.guest_email || "guest@casanest.in",
      guest_phone: p.guest_phone || undefined,
      check_in: p.check_in || new Date().toISOString().split("T")[0],
      check_out: p.check_out || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      guests: p.guests || 1,
      total_amount: Number(p.total_amount || p.amount),
      status: validBookingStatus,
      payment_status: p.status || "pending",
      notes: undefined,
      created_at: p.created_at,
      room_name: p.room_name || "Casa Nest Deluxe Room",
      price_per_night: undefined,
      payment_method: p.payment_method || "Online / Cash",
      transaction_id: p.transaction_id || `TXN-${p.id}`,
      payment_amount: Number(p.amount || p.total_amount),
      payment_date: p.created_at,
    };
    setSelectedInvoiceBooking(bookingData);
  };

  // Calculations
  const totalBilled = payments.reduce((sum, p) => sum + Number(p.total_amount || p.amount || 0), 0);
  const paidPayments = payments.filter((p) => p.status === "paid");
  const pendingPayments = payments.filter((p) => p.status === "pending" || !p.status);
  const totalCollected = paidPayments.reduce((sum, p) => sum + Number(p.amount || p.total_amount || 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.total_amount || p.amount || 0), 0);

  // Filtered List
  const filteredPayments = payments.filter((p) => {
    // Filter by tab
    if (activeFilter === "paid" && p.status !== "paid") return false;
    if (activeFilter === "pending" && p.status !== "pending" && p.status) return false;
    if (activeFilter === "failed" && p.status !== "failed" && p.status !== "refunded") return false;

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = (p.customer_name || p.guest_name || "").toLowerCase();
      const email = (p.guest_email || "").toLowerCase();
      const phone = (p.guest_phone || "").toLowerCase();
      const txn = (p.transaction_id || "").toLowerCase();
      const room = (p.room_name || "").toLowerCase();
      const bId = String(p.booking_id || "");
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        txn.includes(q) ||
        room.includes(q) ||
        bId.includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout
      title="Payments & Revenue Ledger"
      subtitle="Track real-time guest payments: Kiska payment ho chuka hai aur kiska baki hai"
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
          <button
            onClick={handleOpenAdd}
            className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Record Payment</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards: Paid vs Pending Clear Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Revenue Billed */}
          <div className="p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-[#77766c]">
                Total Billed Bookings
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#f5f0e8] text-[#20352b] flex items-center justify-center">
                <Receipt size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-[#20352b] mt-2">
              ₹{totalBilled.toLocaleString()}
            </div>
            <div className="text-xs text-[#77766c] mt-1 flex items-center gap-1.5">
              <span>{payments.length} Total Bookings / Entries</span>
            </div>
          </div>

          {/* Card 2: Payment Ho Chuka Hai (Paid) */}
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-emerald-800">
                  Payment Ho Chuka Hai (PAID)
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-emerald-950 mt-2">
              ₹{totalCollected.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1.5">
              <span>✅ {paidPayments.length} Guests ka payment receive ho gaya</span>
            </div>
          </div>

          {/* Card 3: Payment Nahi Hua Hai (Pending / Unpaid) */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-800">
                  Payment Nahi Hua Hai (PENDING)
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-amber-950 mt-2">
              ₹{totalPending.toLocaleString()}
            </div>
            <div className="text-xs text-amber-700 mt-1 font-medium flex items-center gap-1.5">
              <span>⏳ {pendingPayments.length} Guests ka balance pending hai</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#20352b]/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === "all"
                  ? "bg-[#20352b] text-white shadow-xs"
                  : "bg-[#f5f0e8] text-[#20352b] hover:bg-[#eae4d8]"
              }`}
            >
              Sabhi ({payments.length})
            </button>
            <button
              onClick={() => setActiveFilter("paid")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === "paid"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Payment Ho Chuka Hai ({paidPayments.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Clock size={13} />
              <span>Payment Nahi Hua Hai ({pendingPayments.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search by Guest, Room, Phone, Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-xl text-xs text-[#20352b] placeholder-[#77766c] focus:outline-none focus:border-[#20352b]"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-3xl border border-[#20352b]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#20352b]">
              <thead>
                <tr className="bg-[#f5f0e8]/70 border-b border-[#20352b]/10 font-mono text-[10px] uppercase text-[#77766c] tracking-wider">
                  <th className="py-3 px-4">Ref / Txn ID</th>
                  <th className="py-3 px-4">Guest Details</th>
                  <th className="py-3 px-4">Room & Stay</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20352b]/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#77766c]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCcw size={20} className="animate-spin text-[#20352b]" />
                        <span>Payments data fetch ho raha hai...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#77766c]">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <AlertCircle size={28} className="text-[#c8a36a]" />
                        <p className="font-medium text-sm text-[#20352b]">Koi payment record nahi mila</p>
                        <p className="text-xs text-[#77766c]">
                          {searchTerm
                            ? "Aapke search keyword ke mutabik koi results nahi hain."
                            : "Selected filter me abhi koi payment entry nahi hai."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isPaid = p.status === "paid";
                    const isPending = p.status === "pending" || !p.status;
                    const amountVal = Number(p.total_amount || p.amount || 0);

                    return (
                      <tr
                        key={`${p.booking_id || "direct"}-${p.id}-${p.transaction_id}`}
                        className={`hover:bg-[#fbf8f1] transition-colors ${
                          isPending ? "bg-amber-50/20" : ""
                        }`}
                      >
                        {/* Ref / Txn ID */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-semibold text-[#20352b]">
                            {p.transaction_id || (p.booking_id ? `CN-BK-${p.booking_id}` : `TXN-${p.id}`)}
                          </div>
                          {p.booking_id && (
                            <span className="text-[10px] text-[#77766c] block">
                              Booking #CN-{String(p.booking_id).padStart(4, "0")}
                            </span>
                          )}
                          <span className="text-[10px] text-[#77766c]">
                            {new Date(p.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Guest Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-[#20352b]">
                            {p.customer_name || p.guest_name || "Guest User"}
                          </div>
                          <div className="text-[11px] text-[#77766c] flex items-center gap-2 mt-0.5">
                            {p.guest_phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} />
                                {p.guest_phone}
                              </span>
                            )}
                            {p.guest_email && (
                              <span className="flex items-center gap-1">
                                <Mail size={11} />
                                {p.guest_email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Room & Stay */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#20352b] flex items-center gap-1.5">
                            <BedDouble size={13} className="text-[#c8a36a]" />
                            <span>{p.room_name || "Casa Nest Homestay Room"}</span>
                          </div>
                          {p.check_in && p.check_out && (
                            <div className="text-[11px] text-[#77766c] mt-0.5 flex items-center gap-1">
                              <Calendar size={11} />
                              <span>
                                {new Date(p.check_in).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}{" "}
                                -{" "}
                                {new Date(p.check_out).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-sm text-[#20352b]">
                            ₹{amountVal.toLocaleString()}
                          </span>
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Ho Chuka Hai (PAID)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200 animate-pulse">
                              <Clock size={12} className="text-amber-600" />
                              <span>Nahi Hua (PENDING)</span>
                            </span>
                          )}
                        </td>

                        {/* Payment Mode & Dropdown */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#f5f0e8] text-[11px] font-mono text-[#20352b] border border-[#20352b]/10 inline-block">
                            {p.payment_method || "Pay at Desk"}
                          </span>
                          <div className="mt-1">
                            <select
                              value={p.status || "pending"}
                              onChange={(e) => handleStatusChange(p, e.target.value)}
                              className="text-[11px] font-mono bg-transparent border border-[#20352b]/15 rounded-md px-1.5 py-0.5 cursor-pointer text-[#20352b] focus:outline-none"
                            >
                              <option value="paid">Mark Paid ✅</option>
                              <option value="pending">Mark Pending ⏳</option>
                              <option value="refunded">Refunded ↩️</option>
                              <option value="failed">Failed ❌</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* If Paid: Show View & Download Slip */}
                            {isPaid && (
                              <button
                                onClick={() => handleViewInvoice(p)}
                                className="px-3 py-1.5 rounded-xl bg-[#20352b] text-[#fbf8f1] hover:bg-[#20352b]/90 text-xs font-medium flex items-center gap-1 shadow-xs transition-all"
                                title="View & Download Official Payment Slip"
                              >
                                <FileText size={13} className="text-[#c8a36a]" />
                                <span>Slip Download</span>
                              </button>
                            )}

                            {/* If Pending: Show Collect / Mark as Paid */}
                            {isPending && (
                              <button
                                onClick={() => handleOpenCollect(p)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-all"
                                title="Collect Payment at Desk & Mark Paid"
                              >
                                <Check size={13} />
                                <span>Collect / Paid Karein</span>
                              </button>
                            )}
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

      {/* Collect / Mark Paid Modal */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Payment Collect & Mark as Paid"
        subtitle="Guest se payment receive karke status turant confirm karein"
        maxWidth="sm"
      >
        {selectedPaymentForCollect && (
          <form onSubmit={handleConfirmCollection} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold block">
                  Payable Amount
                </span>
                <span className="text-xl font-serif font-bold text-emerald-950">
                  ₹{Number(selectedPaymentForCollect.total_amount || selectedPaymentForCollect.amount).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#20352b] block">
                  {selectedPaymentForCollect.customer_name || selectedPaymentForCollect.guest_name}
                </span>
                <span className="text-[11px] text-[#77766c]">
                  {selectedPaymentForCollect.room_name || "Stay Booking"}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Payment Collection Mode *
              </label>
              <select
                value={collectMethod}
                onChange={(e) => setCollectMethod(e.target.value)}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="Cash at Desk">Cash at Reception Desk</option>
                <option value="UPI / QR Code">UPI / QR Code Scan</option>
                <option value="Credit / Debit Card">Credit / Debit Card POS</option>
                <option value="Net Banking">Net Banking Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Reference / Receipt Note (Optional)
              </label>
              <input
                type="text"
                value={collectTxnId}
                onChange={(e) => setCollectTxnId(e.target.value)}
                placeholder="e.g. UPI Ref # or Cash Receipt #"
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="button button-light border border-[#20352b]/15 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={collecting}
                className="button button-dark bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>{collecting ? "Saving..." : "Confirm & Mark Paid ✅"}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manual Record Payment Entry Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record New Payment Entry"
        subtitle="Direct offline payment ya front desk receipt generate karne ke liye"
        maxWidth="sm"
      >
        <form onSubmit={handleSubmitNewPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Guest / Customer Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={formData.customer_name || ""}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={formData.amount || ""}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
              min={1}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method || "Cash"}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="Cash at Front Desk">Cash at Front Desk</option>
              <option value="UPI / QR Code">UPI / QR Code</option>
              <option value="Card (POS)">Card (POS)</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Transaction ID / Ref #
            </label>
            <input
              type="text"
              value={formData.transaction_id || ""}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Payment Status
            </label>
            <select
              value={formData.status || "paid"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="paid">Paid (Received) ✅</option>
              <option value="pending">Pending (Balance Due) ⏳</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Booking Voucher / Payment Slip Modal */}
      <BookingInvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={Boolean(selectedInvoiceBooking)}
        onClose={() => setSelectedInvoiceBooking(null)}
      />
    </AdminLayout>
  );
}

import React, { useEffect, useState } from "react";
import { Eye, Edit3, Trash2, Calendar, User, Mail, Phone, Moon, CreditCard, Sparkles, Printer, Receipt, CheckCircle2, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import BookingInvoiceModal from "@/components/BookingInvoiceModal";
import { getBookings, updateBooking, deleteBooking, Booking } from "@/api/bookings";
import { toast } from "sonner";

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit status form state
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>("pending");
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>("Cash");
  const [editTransactionId, setEditTransactionId] = useState<string>("");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditStatus(booking.status);
    setEditPaymentStatus(booking.payment_status);
    setEditPaymentMethod(booking.payment_method || "Cash");
    setEditTransactionId(booking.transaction_id || "");
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      await updateBooking(selectedBooking.id, {
        status: editStatus,
        payment_status: editPaymentStatus,
        payment_method: editPaymentMethod,
        transaction_id: editTransactionId,
      });
      toast.success("Booking and payment status updated.");
      setIsEditModalOpen(false);
      loadBookings();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await deleteBooking(id);
      toast.success("Booking removed.");
      loadBookings();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete booking.");
    }
  };

  const columns: Column<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      render: (b) => (
        <span className="font-mono font-semibold text-[#20352b]">
          #CN-{String(b.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "guest_name",
      header: "Guest",
      render: (b) => (
        <div>
          <span className="font-semibold text-[#20352b] block">{b.guest_name}</span>
          <span className="text-[11px] text-[#77766c]">{b.guest_email}</span>
        </div>
      ),
    },
    {
      key: "room_name",
      header: "Room & Guests",
      render: (b) => (
        <div>
          <span className="font-medium text-[#20352b] block">{b.room_name || "Any Room"}</span>
          <span className="text-[11px] text-[#77766c]">{b.guests} Guest(s)</span>
        </div>
      ),
    },
    {
      key: "check_in",
      header: "Stay Dates",
      render: (b) => (
        <div className="font-mono text-[11px] text-[#20352b]">
          <div>In: {new Date(b.check_in).toLocaleDateString()}</div>
          <div>Out: {new Date(b.check_out).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Amount",
      render: (b) => (
        <div>
          <span className="font-mono font-semibold text-[#20352b] block">
            ₹{Number(b.total_amount).toLocaleString()}
          </span>
          <span className="text-[10px] uppercase font-mono text-[#77766c]">
            {b.payment_status}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Booking Status",
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedInvoiceBooking(b)}
            className="p-1.5 rounded-lg text-[#c8a36a] hover:bg-[#c8a36a]/15 transition-colors"
            title="View & Download Payment Slip / Invoice"
          >
            <Receipt size={15} />
          </button>
          <button
            onClick={() => handleOpenDetails(b)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenEdit(b)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Update Status"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={() => handleDelete(b.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const paidCount = bookings.filter((b) => b.payment_status === "paid").length;

  return (
    <AdminLayout
      title="Booking Management"
      subtitle="Track reservations, check-ins, guest stays, itemized billing, and payments"
      actions={
        <button
          onClick={loadBookings}
          className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs"
        >
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 shadow-xs">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#50574d] block">Total Reservations</span>
            <span className="font-serif text-2xl font-bold text-[#1a2f23] mt-1 block">{bookings.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 shadow-xs">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#50574d] block">Confirmed Stays</span>
            <span className="font-serif text-2xl font-bold text-emerald-700 mt-1 block">{confirmedCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 shadow-xs">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#50574d] block">Pending Reviews</span>
            <span className="font-serif text-2xl font-bold text-amber-700 mt-1 block">{pendingCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 shadow-xs">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#50574d] block">Revenue Collected</span>
            <span className="font-serif text-2xl font-bold text-[#9e6d27] mt-1 block">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-[#50574d] block mt-0.5">{paidCount} Paid Booking(s)</span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={bookings}
          loading={loading}
          searchPlaceholder="Search by guest name, email, or room..."
          searchKey={(b) => `${b.guest_name} ${b.guest_email} ${b.room_name || ""}`}
          filterOptions={[
            { label: "Pending", value: "pending" },
            { label: "Confirmed", value: "confirmed" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
          filterKey={(b) => b.status}
          emptyMessage="No bookings found."
        />
      </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Reservation #CN-${String(selectedBooking?.id || 0).padStart(5, "0")}`}
        subtitle="Full guest reservation overview, stay timings, billing and payment information"
        maxWidth="lg"
      >
        {selectedBooking && (() => {
          const checkIn = new Date(selectedBooking.check_in);
          const checkOut = new Date(selectedBooking.check_out);
          const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
          const pricePerNight = selectedBooking.price_per_night
            ? Number(selectedBooking.price_per_night)
            : Math.round(Number(selectedBooking.total_amount) / nights);

          return (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                    Reservation Status
                  </span>
                  <StatusBadge status={selectedBooking.status} className="mt-1" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                    Payment Status
                  </span>
                  <StatusBadge status={selectedBooking.payment_status} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#c8a36a] block">
                    Guest Information
                  </span>
                  <p className="font-semibold text-sm text-[#20352b]">{selectedBooking.guest_name}</p>
                  <div className="space-y-1 text-[#77766c]">
                    <p className="flex items-center gap-2">
                      <Mail size={13} /> {selectedBooking.guest_email}
                    </p>
                    {selectedBooking.guest_phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} /> {selectedBooking.guest_phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <User size={13} /> {selectedBooking.guests} Guest(s)
                    </p>
                    {selectedBooking.created_at && (
                      <p className="flex items-center gap-2 text-[10px] text-[#77766c] pt-1">
                        <Clock size={11} /> Booked on: {new Date(selectedBooking.created_at).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#c8a36a] block">
                    Stay Schedule & Standard Timings
                  </span>
                  <p className="font-semibold text-sm text-[#20352b]">
                    {selectedBooking.room_name || "Assigned Suite"}
                  </p>
                  <div className="space-y-1 text-[#77766c]">
                    <p className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Calendar size={13} /> Check-In:</span>
                      <strong className="text-[#20352b]">{checkIn.toLocaleDateString("en-IN")} (From 12:00 PM)</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Calendar size={13} /> Check-Out:</span>
                      <strong className="text-[#20352b]">{checkOut.toLocaleDateString("en-IN")} (Until 11:00 AM)</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Stay Duration:</span>
                      <strong className="text-[#20352b]">{nights} Night(s)</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Itemized Billing Table */}
              <div className="p-4 rounded-2xl bg-[#f5f0e8]/80 border border-[#20352b]/10 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#c8a36a] block">
                  Billing & Settlement Breakdown
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#77766c]">
                    <span>Room Rate:</span>
                    <span className="font-mono">₹{pricePerNight.toLocaleString("en-IN")} / night</span>
                  </div>
                  <div className="flex justify-between text-[#77766c]">
                    <span>Stay Calculation:</span>
                    <span className="font-mono">₹{pricePerNight.toLocaleString("en-IN")} × {nights} night(s) = ₹{(pricePerNight * nights).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#77766c]">
                    <span>Taxes & Service Charges:</span>
                    <span>Included in Total</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#20352b] pt-2 border-t border-[#20352b]/10">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-base">₹{Number(selectedBooking.total_amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 text-[#77766c]">
                    <span>Payment Mode: <strong>{selectedBooking.payment_method || "Cash / UPI"}</strong></span>
                    {selectedBooking.transaction_id && <span>Txn ID: <strong className="font-mono">{selectedBooking.transaction_id}</strong></span>}
                    <span>Status: <strong className={selectedBooking.payment_status === "paid" ? "text-emerald-700" : "text-amber-800"}>{selectedBooking.payment_status.toUpperCase()}</strong></span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="p-3.5 rounded-2xl bg-[#f5f0e8]/60 border border-[#20352b]/10">
                  <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">
                    Guest Special Requests / Notes:
                  </span>
                  <p className="text-[#20352b]">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-[#20352b]/10 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceBooking(selectedBooking);
                  }}
                  className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <Receipt size={13} className="text-[#c8a36a]" />
                  <span>Print Guest Invoice / Bill</span>
                </button>

                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedBooking);
                  }}
                  className="button button-dark px-5 py-2 text-xs"
                >
                  Update Reservation & Payment
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Status & Payment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Reservation & Payment"
        subtitle="Change booking workflow, mark payments, and record transaction reference"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Booking Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Payment Status
            </label>
            <select
              value={editPaymentStatus}
              onChange={(e) => setEditPaymentStatus(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="pending">Pending (Unpaid)</option>
              <option value="paid">Paid (Settled)</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Payment Method
            </label>
            <select
              value={editPaymentMethod}
              onChange={(e) => setEditPaymentMethod(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="Cash">Cash at Desk</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="Bank Transfer">Direct Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Transaction Ref / Receipt No.
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-983712 / REC-4412"
              value={editTransactionId}
              onChange={(e) => setEditTransactionId(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Guest Invoice / Voucher Modal */}
      <BookingInvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={Boolean(selectedInvoiceBooking)}
        onClose={() => setSelectedInvoiceBooking(null)}
      />
      
    </AdminLayout>
  );
}


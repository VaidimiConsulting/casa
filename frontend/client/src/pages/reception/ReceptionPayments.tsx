import React, { useEffect, useState } from "react";
import {
  Plus,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Search,
  IndianRupee,
  Receipt,
  Printer,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { fetchPayments, createPayment, updatePaymentStatus, Payment } from "@/api/payments";
import { toast } from "sonner";

export default function ReceptionPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Payment>>({
    customer_name: "",
    amount: 3500,
    payment_method: "Cash",
    transaction_id: "",
    status: "paid",
  });

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchPayments();
      setPayments(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payment transactions.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecord = () => {
    setFormData({
      customer_name: "",
      amount: 3500,
      payment_method: "Cash",
      transaction_id: `CN-${Date.now().toString().slice(-6)}`,
      status: "paid",
    });
    setIsRecordModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name?.trim()) {
      toast.error("Guest name is required.");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Valid payment amount is required.");
      return;
    }

    try {
      await createPayment(formData);
      toast.success("Payment recorded successfully.");
      setIsRecordModalOpen(false);
      loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to record payment.");
    }
  };

  const handleStatusChange = async (payment: Payment, newStatus: string) => {
    try {
      await updatePaymentStatus(payment.id, newStatus);
      toast.success(`Payment marked as ${newStatus}`);
      loadPayments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      (p.customer_name && p.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.guest_name && p.guest_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(search.toLowerCase())) ||
      (p.room_name && p.room_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchMethod = methodFilter === "all" || p.payment_method?.toLowerCase() === methodFilter.toLowerCase();
    return matchSearch && matchStatus && matchMethod;
  });

  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCollected = payments
    .filter((p) => p.status === "paid" && p.created_at?.startsWith(todayStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <ReceptionLayout
      title="Front Desk Billing & Payments"
      subtitle="Record in-person stay settlements, front-desk cash/UPI collections, and print receipts"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadPayments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenRecord}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c8a36a] text-[#20352b] text-xs font-semibold hover:bg-[#b59259] transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Collect Payment</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Today's Collections</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-[#20352b]">
                ₹{todayCollected.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-[#77766c] mt-1">Cleared today at front desk</p>
          </div>

          <div className="bg-[#20352b] text-white border border-[#20352b] p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-[#f6d79e] font-semibold block mb-1">Total Settled (All-Time)</span>
            <span className="text-2xl font-serif font-bold text-white">
              ₹{totalCollected.toLocaleString()}
            </span>
            <p className="text-[11px] text-white/80 mt-1">All verified payments</p>
          </div>

          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-amber-700 block mb-1">Pending Settlements</span>
            <span className="text-2xl font-serif font-bold text-amber-800">
              ₹{pendingAmount.toLocaleString()}
            </span>
            <p className="text-[11px] text-[#77766c] mt-1">Awaiting final guest checkout</p>
          </div>

          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-5 rounded-3xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Transactions Count</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{payments.length}</span>
            <p className="text-[11px] text-[#77766c] mt-1">Recorded payment entries</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search guest, transaction ID or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-2xl text-xs text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-2xl text-xs text-[#20352b] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-2xl text-xs text-[#20352b] focus:outline-none"
            >
              <option value="all">All Desk Methods</option>
              <option value="cash">Cash (Front Desk)</option>
              <option value="upi">UPI / QR Code (Pay at Desk)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#77766c]">Loading payment logs...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-[#77766c] space-y-2">
              <CreditCard size={36} className="mx-auto opacity-40 mb-1" />
              <p className="font-serif text-base text-[#20352b]">No Payment Transactions Found</p>
              <p className="text-xs">No records matched your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f0e8]/80 border-b border-[#20352b]/10 text-[10px] uppercase font-mono tracking-wider text-[#77766c]">
                  <tr>
                    <th className="px-5 py-3">Txn Reference</th>
                    <th className="px-5 py-3">Guest / Payer</th>
                    <th className="px-5 py-3">Payment Mode</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20352b]/8">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f5f0e8]/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-[#20352b]">
                        {p.transaction_id || `CN-TXN-${p.id}`}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#20352b]">
                          {p.customer_name || p.guest_name || "Walk-in Guest"}
                        </p>
                        {p.room_name && (
                          <p className="text-[10px] text-[#77766c]">{p.room_name}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#20352b]/8 text-[11px] font-mono text-[#20352b] font-medium">
                          {p.payment_method || "UPI"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-sm text-[#20352b]">
                        ₹{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-[#77766c] text-[11px]">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {p.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(p, "paid")}
                            className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[11px] font-semibold transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2.5 py-1 rounded-xl bg-[#f5f0e8] hover:bg-[#efe7db] border border-[#20352b]/15 text-[11px] font-semibold text-[#20352b] inline-flex items-center gap-1 transition-colors"
                        >
                          <Receipt size={12} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Guest Payment / Bill Settlement"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#20352b] mb-1">Guest / Payer Name *</label>
            <input
              type="text"
              required
              value={formData.customer_name || ""}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#20352b] mb-1">Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                <option value="Cash">Cash (Front Desk)</option>
                <option value="UPI">UPI / QR Code (Pay at Desk)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Transaction Ref / Note</label>
              <input
                type="text"
                value={formData.transaction_id || ""}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="UPI ref or Desk receipt #"
              />
            </div>

            <div>
              <label className="block font-medium text-[#20352b] mb-1">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "paid" | "pending",
                  })
                }
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                <option value="paid">Paid & Cleared</option>
                <option value="pending">Pending Settlement</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Guest Folio / Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Payment Folio & Receipt"
        >
          <div className="space-y-4 text-xs" id="printable-receipt">
            {/* Receipt Header */}
            <div className="p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
              <h3 className="font-serif text-lg font-bold text-[#20352b]">Casa Nest Homestay</h3>
              <p className="text-[10px] text-[#77766c] uppercase font-mono tracking-wider">
                Official Front Desk Receipt
              </p>
              <p className="text-[11px] text-[#77766c] mt-1">
                Txn #{selectedReceipt.transaction_id || `CN-${selectedReceipt.id}`}
              </p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 py-2 border-y border-[#20352b]/10">
              <div className="flex justify-between">
                <span className="text-[#77766c]">Guest Name:</span>
                <span className="font-semibold text-[#20352b]">
                  {selectedReceipt.customer_name || selectedReceipt.guest_name || "Walk-in Guest"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77766c]">Payment Mode:</span>
                <span className="font-mono font-medium text-[#20352b]">
                  {selectedReceipt.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77766c]">Date & Time:</span>
                <span className="text-[#20352b]">
                  {selectedReceipt.created_at
                    ? new Date(selectedReceipt.created_at).toLocaleString("en-IN")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#77766c]">Status:</span>
                <span className="font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  {selectedReceipt.status}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-[#20352b] text-[#fbf8f1]">
              <span className="font-medium text-xs">Total Amount Paid</span>
              <span className="font-mono text-lg font-bold text-[#c8a36a]">
                ₹{Number(selectedReceipt.amount).toLocaleString()}
              </span>
            </div>

            <p className="text-[10px] text-center text-[#77766c]">
              Thank you for choosing Casa Nest Homestay. Have a delightful stay!
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="button button-light border border-[#20352b]/15 px-4 py-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="button button-dark px-4 py-2 flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ReceptionLayout>
  );
}

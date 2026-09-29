import React, { useEffect, useState } from "react";
import { Eye, Edit3, Trash2, ShoppingBag, Utensils, CheckCircle2, Phone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import {
  fetchOrders,
  updateOrderStatus,
  updateOrderPayment,
  deleteOrder,
  FoodOrder,
} from "@/api/orders";
import { toast } from "sonner";

export default function FoodOrders() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Status form state
  const [statusVal, setStatusVal] = useState<string>("new");
  const [paymentStatusVal, setPaymentStatusVal] = useState<string>("pending");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load restaurant orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (order: FoodOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenStatusModal = (order: FoodOrder) => {
    setSelectedOrder(order);
    setStatusVal(order.status);
    setPaymentStatusVal(order.payment_status);
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await updateOrderStatus(selectedOrder.id, statusVal);
      await updateOrderPayment(selectedOrder.id, paymentStatusVal);
      toast.success("Order status and payment updated.");
      setIsStatusModalOpen(false);
      loadOrders();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update order.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteOrder(id);
      toast.success("Order deleted.");
      loadOrders();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete order.");
    }
  };

  const columns: Column<FoodOrder>[] = [
    {
      key: "order_number",
      header: "Order #",
      render: (o) => (
        <span className="font-mono font-semibold text-[#20352b]">{o.order_number}</span>
      ),
    },
    {
      key: "customer_name",
      header: "Customer & Destination",
      render: (o) => (
        <div>
          <span className="font-semibold text-[#20352b] block">{o.customer_name}</span>
          <span className="text-[11px] text-[#77766c]">
            {o.room_number ? `Room ${o.room_number}` : "Dining In / Takeaway"} • {o.customer_phone}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items Ordered",
      render: (o) => (
        <div>
          <span className="font-medium text-[#20352b]">
            {(o.items || []).map((it) => `${it.quantity}x ${it.item_name}`).join(", ") ||
              `${o.items?.length || 1} items`}
          </span>
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Total",
      render: (o) => (
        <div>
          <span className="font-mono font-semibold text-[#20352b] block">
            ₹{Number(o.total_amount).toLocaleString()}
          </span>
          <span className="text-[10px] uppercase font-mono text-[#77766c]">
            {o.payment_status}
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Order Time",
      render: (o) => (
        <span className="font-mono text-[11px] text-[#77766c]">
          {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Order Status",
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDetails(o)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="View Order Slip"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenStatusModal(o)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Update Kitchen Status"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={() => handleDelete(o.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Order"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Restaurant Orders"
      subtitle="Track kitchen orders, meal prep, and dining room delivery"
      actions={
        <button
          onClick={loadOrders}
          className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs"
        >
          Refresh Orders
        </button>
      }
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          searchPlaceholder="Search by customer, room, or order #..."
          searchKey={(o) => `${o.order_number} ${o.customer_name} ${o.room_number || ""}`}
          filterOptions={[
            { label: "New", value: "new" },
            { label: "Confirmed", value: "confirmed" },
            { label: "Preparing", value: "preparing" },
            { label: "Ready", value: "ready" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
          filterKey={(o) => o.status}
          emptyMessage="No restaurant orders found."
        />
      </div>

      {/* Order Details Modal (Kitchen Slip) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Kitchen Ticket: ${selectedOrder?.order_number || ""}`}
        subtitle="Order itemization, delivery notes and customer details"
        maxWidth="md"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                  Kitchen Status
                </span>
                <StatusBadge status={selectedOrder.status} className="mt-1" />
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                  Destination
                </span>
                <span className="font-semibold text-sm text-[#20352b]">
                  {selectedOrder.room_number ? `Room ${selectedOrder.room_number}` : "Dining Table"}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-3.5 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#c8a36a] block">
                Customer
              </span>
              <p className="font-semibold text-sm text-[#20352b]">{selectedOrder.customer_name}</p>
              <p className="text-[#77766c] flex items-center gap-1.5">
                <Phone size={12} /> {selectedOrder.customer_phone}
              </p>
            </div>

            {/* Order Items Table */}
            <div className="border border-[#20352b]/10 rounded-2xl overflow-hidden bg-[#fbf8f1]">
              <div className="bg-[#f5f0e8]/80 px-3.5 py-2 font-mono text-[10px] uppercase text-[#77766c] flex justify-between font-semibold">
                <span>Item</span>
                <span>Qty & Price</span>
              </div>
              <div className="divide-y divide-[#20352b]/8">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="font-medium text-[#20352b]">
                      {it.quantity}x {it.item_name}
                    </span>
                    <span className="font-mono font-semibold text-[#20352b]">
                      ₹{Number(it.subtotal).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-[#f5f0e8]/50 px-3.5 py-2.5 border-t border-[#20352b]/10 flex items-center justify-between font-semibold">
                <span>Total Amount:</span>
                <span className="font-mono text-sm text-[#20352b]">
                  ₹{Number(selectedOrder.total_amount).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="p-3 rounded-xl bg-[#f5f0e8] border border-[#20352b]/10">
                <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-0.5">
                  Special Cooking Instructions:
                </span>
                <p className="text-[#20352b]">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="pt-3 border-t border-[#20352b]/10 flex justify-end">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenStatusModal(selectedOrder);
                }}
                className="button button-dark px-5 py-2 text-xs"
              >
                Change Kitchen Status
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Changer Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Order Status"
        subtitle="Manage kitchen preparation workflow"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Kitchen Status
            </label>
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="new">New Order</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing in Kitchen</option>
              <option value="ready">Ready for Service</option>
              <option value="completed">Completed / Served</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Payment Status
            </label>
            <select
              value={paymentStatusVal}
              onChange={(e) => setPaymentStatusVal(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="pending">Pending (Pay at Room / Counter)</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Status
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

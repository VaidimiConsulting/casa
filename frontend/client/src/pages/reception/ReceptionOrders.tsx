import React, { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import Modal from "@/components/admin/Modal";
import {
  RefreshCw,
  Search,
  Plus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  IndianRupee,
  Utensils,
} from "lucide-react";
import api from "@/api/axios";
import { fetchMenuItems, MenuItem } from "@/api/menu";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-rose-100 text-rose-700",
};

interface OrderItem {
  menu_item_id: number;
  item_name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
}

export default function ReceptionOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  // New Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    room_number: "Room 101",
    payment_method: "Cash / Room Charge",
    notes: "",
  });
  const [selectedDishes, setSelectedDishes] = useState<OrderItem[]>([]);
  const [currentDishId, setCurrentDishId] = useState<number>(0);
  const [currentQty, setCurrentQty] = useState<number>(1);

  // View / Print Details Modal
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
    loadMenu();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load food orders.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMenu() {
    try {
      const items = await fetchMenuItems({ isAvailable: true });
      setMenuItems(items);
      if (items.length > 0) {
        setCurrentDishId(items[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(`Order status updated to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  async function updatePaymentStatus(id: number, payment_status: string) {
    try {
      await api.put(`/orders/${id}/payment`, { payment_status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status } : o)));
      toast.success(`Payment updated to ${payment_status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment.");
    }
  }

  const handleAddDishToOrder = () => {
    const dish = menuItems.find((m) => m.id === Number(currentDishId));
    if (!dish) return;

    setSelectedDishes((prev) => {
      const existing = prev.find((item) => item.menu_item_id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.menu_item_id === dish.id
            ? { ...item, quantity: item.quantity + currentQty }
            : item
        );
      }
      return [
        ...prev,
        {
          menu_item_id: dish.id,
          item_name: dish.name,
          price: Number(dish.price),
          quantity: currentQty,
        },
      ];
    });
    setCurrentQty(1);
  };

  const handleRemoveDish = (index: number) => {
    setSelectedDishes((prev) => prev.filter((_, i) => i !== index));
  };

  const orderSubtotal = selectedDishes.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customer_name.trim()) {
      toast.error("Guest name is required.");
      return;
    }
    if (!orderForm.customer_phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    if (selectedDishes.length === 0) {
      toast.error("Please add at least one dish to the order.");
      return;
    }

    try {
      await api.post("/orders", {
        ...orderForm,
        items: selectedDishes,
      });
      toast.success("Food order placed successfully for kitchen!");
      setIsModalOpen(false);
      setSelectedDishes([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create food order.");
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.room_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;

  return (
    <ReceptionLayout
      title="Food Orders & Room Service"
      subtitle="Manage kitchen orders, track dining status, and place room service requests"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setOrderForm({
                customer_name: "",
                customer_phone: "",
                customer_email: "",
                room_number: "Room 101",
                payment_method: "Cash / Room Charge",
                notes: "",
              });
              setSelectedDishes([]);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c8a36a] text-[#20352b] text-xs font-semibold hover:bg-[#b59259] transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Take Food Order</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Total Orders</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{orders.length}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-purple-700 block mb-1">Active (In Kitchen)</span>
            <span className="text-2xl font-serif font-bold text-purple-800">{activeOrdersCount}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block mb-1">Ready for Delivery</span>
            <span className="text-2xl font-serif font-bold text-emerald-800">
              {orders.filter((o) => o.status === "ready").length}
            </span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Delivered Today</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">
              {orders.filter((o) => o.status === "completed").length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search guest, order # or room..."
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
            <option value="all">All Orders</option>
            <option value="new">New (Received)</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed / Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="text-center py-16 text-[#77766c] text-xs">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl p-12 text-center">
            <ShoppingBag size={36} className="mx-auto text-[#77766c] mb-3 opacity-40" />
            <p className="font-serif text-lg text-[#20352b] mb-1">No Orders Found</p>
            <p className="text-xs text-[#77766c]">No orders match your filter criteria.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((o) => (
              <div
                key={o.id}
                className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-mono text-[#c8a36a] font-bold">
                        #{o.order_number}
                      </p>
                      <h3 className="font-serif text-base font-semibold text-[#20352b] mt-0.5">
                        {o.customer_name}
                      </h3>
                      {o.room_number && (
                        <p className="text-[11px] font-mono font-medium text-[#20352b] mt-0.5">
                          📍 {o.room_number}
                        </p>
                      )}
                      {o.customer_phone && (
                        <p className="text-[10px] text-[#77766c]">{o.customer_phone}</p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-semibold ${
                        STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  {/* Items summary */}
                  {o.items && o.items.length > 0 && (
                    <div className="bg-[#f5f0e8]/50 rounded-xl p-2.5 mb-3 space-y-1">
                      {o.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-[#20352b]">
                            {it.quantity}x {it.item_name}
                          </span>
                          <span className="font-mono text-[#77766c]">
                            ₹{Number(it.price) * Number(it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {o.notes && (
                    <p className="text-[10px] italic text-[#77766c] mb-3 bg-white/50 p-2 rounded-lg border border-[#20352b]/5">
                      Note: {o.notes}
                    </p>
                  )}

                  {/* Pricing & Payment Status */}
                  <div className="flex items-center justify-between text-xs mb-3 bg-[#f5f0e8]/80 rounded-2xl p-2.5 border border-[#20352b]/8">
                    <div>
                      <span className="text-[10px] text-[#77766c] block">Bill Total</span>
                      <span className="font-bold font-mono text-sm text-[#20352b]">
                        ₹{Number(o.total_amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        updatePaymentStatus(
                          o.id,
                          o.payment_status === "paid" ? "pending" : "paid"
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                        o.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                      title="Click to toggle payment status"
                    >
                      {o.payment_status === "paid" ? "✓ Paid" : "⏳ Unpaid"}
                    </button>
                  </div>
                </div>

                {/* Status selector */}
                <div className="pt-2 border-t border-[#20352b]/8 flex items-center gap-2">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    disabled={updating === o.id}
                    className="flex-1 text-xs border border-[#20352b]/15 rounded-xl px-3 py-2 bg-[#f5f0e8] text-[#20352b] focus:outline-none disabled:opacity-50"
                  >
                    <option value="new">New (Order Received)</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Kitchen Preparing</option>
                    <option value="ready">Ready for Delivery</option>
                    <option value="completed">Delivered & Complete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Take New Food Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Take Room Service / Food Order"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Guest Name *</label>
              <input
                type="text"
                required
                value={orderForm.customer_name}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, customer_name: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="Guest name"
              />
            </div>
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={orderForm.room_number}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, room_number: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="e.g. Room 101 or Dining Table 4"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={orderForm.customer_phone}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, customer_phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Payment Method</label>
              <select
                value={orderForm.payment_method}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, payment_method: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                <option value="Cash / Room Charge">Add to Room Folio (Pay at Checkout)</option>
                <option value="UPI / QR Code">UPI / Instant Pay</option>
                <option value="Cash">Cash on Delivery</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          {/* Dish Selector */}
          <div className="p-3 bg-[#f5f0e8]/70 border border-[#20352b]/10 rounded-2xl space-y-2">
            <span className="font-semibold text-[#20352b] block">Add Menu Dishes:</span>
            <div className="flex gap-2 items-center">
              <select
                value={currentDishId}
                onChange={(e) => setCurrentDishId(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — ₹{item.price}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="20"
                value={currentQty}
                onChange={(e) => setCurrentQty(Number(e.target.value))}
                className="w-16 px-2 py-2 bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b] text-center"
              />
              <button
                type="button"
                onClick={handleAddDishToOrder}
                className="px-3 py-2 rounded-xl bg-[#20352b] text-[#fbf8f1] text-xs font-semibold"
              >
                + Add
              </button>
            </div>

            {/* Selected items list */}
            {selectedDishes.length > 0 && (
              <div className="mt-2 space-y-1.5 pt-2 border-t border-[#20352b]/10">
                {selectedDishes.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#fbf8f1] border border-[#20352b]/5"
                  >
                    <div>
                      <span className="font-semibold text-[#20352b]">{item.item_name}</span>
                      <span className="text-[#77766c] ml-2">
                        x{item.quantity} (₹{item.price} ea)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#20352b]">
                        ₹{item.price * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDish(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-semibold text-[#20352b]">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-base font-bold text-[#c8a36a]">
                    ₹{orderSubtotal}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Chef / Delivery Notes</label>
            <input
              type="text"
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="e.g. Extra napkins, less spicy"
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
              Send to Kitchen
            </button>
          </div>
        </form>
      </Modal>
    </ReceptionLayout>
  );
}

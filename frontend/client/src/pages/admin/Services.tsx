import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import {
  Coffee,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  fetchServices,
  createServiceRequest,
  updateServiceStatus,
  deleteServiceRequest,
  RoomServiceRequest,
} from "@/api/services";
import { toast } from "sonner";

const SERVICE_OPTIONS = [
  { label: "Chai & Coffee Sachets Refill (Tea, Coffee, Sugar, Creamer)", icon: "☕" },
  { label: "Electric Kettle & Cups Setup", icon: "🫖" },
  { label: "Bottled Mineral Water", icon: "💧" },
  { label: "Fresh Towels & Bath Linen", icon: "🧼" },
  { label: "Extra Pillows & Blanket", icon: "🛏️" },
  { label: "Room Refresh & Housekeeping", icon: "🧹" },
  { label: "Iron & Ironing Board on Request", icon: "🔌" },
  { label: "Other In-Room Guest Assistance", icon: "🛎️" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function Services() {
  const [services, setServices] = useState<RoomServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  // New Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    room_number: "Room 101",
    guest_name: "",
    service_type: "Chai & Coffee Sachets Refill (Tea, Coffee, Sugar, Creamer)",
    quantity: 2,
    notes: "",
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServices();
      setServices(data || []);
    } catch (err) {
      console.error("Failed to load service requests:", err);
      toast.error("Failed to load room service requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleStatusChange = async (
    id: number,
    newStatus: "pending" | "in_progress" | "completed" | "cancelled"
  ) => {
    try {
      setUpdating(id);
      await updateServiceStatus(id, newStatus);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      toast.success(`Service request status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this request?")) return;
    try {
      await deleteServiceRequest(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service request removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove request");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_number || !formData.service_type) {
      toast.error("Room and service type are required.");
      return;
    }

    try {
      await createServiceRequest({
        room_number: formData.room_number,
        guest_name: formData.guest_name.trim() || undefined,
        service_type: formData.service_type,
        quantity: Number(formData.quantity) || 1,
        notes: formData.notes.trim() || undefined,
      });

      toast.success("Room service request created!");
      setIsModalOpen(false);
      setFormData({
        room_number: "Room 101",
        guest_name: "",
        service_type: "Chai & Coffee Sachets Refill (Tea, Coffee, Sugar, Creamer)",
        quantity: 2,
        notes: "",
      });
      loadServices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record service request");
    }
  };

  const filteredServices = services.filter((item) => {
    const matchesSearch =
      item.room_number?.toLowerCase().includes(search.toLowerCase()) ||
      item.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.service_type?.toLowerCase().includes(search.toLowerCase()) ||
      item.notes?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = services.filter((s) => s.status === "pending").length;
  const inProgressCount = services.filter((s) => s.status === "in_progress").length;
  const completedCount = services.filter((s) => s.status === "completed").length;

  return (
    <AdminLayout
      title="Room Services & Amenities"
      subtitle="Track kettle setups, tea/coffee refills, housekeeping & guest in-room requests"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadServices}
            className="button button-quiet px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Request</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-[#20352b]">
                {pendingCount}
              </div>
              <div className="text-xs text-[#77766c]">Pending Requests</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
              <Coffee size={24} />
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-[#20352b]">
                {inProgressCount}
              </div>
              <div className="text-xs text-[#77766c]">In Progress / Delivering</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-[#20352b]">
                {completedCount}
              </div>
              <div className="text-xs text-[#77766c]">Fulfilled & Completed</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap rounded-2xl bg-[#efe8dc] p-1 gap-1">
            {["all", "pending", "in_progress", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                    : "text-[#77766c] hover:text-[#20352b]"
                }`}
              >
                {st === "all"
                  ? `All (${services.length})`
                  : st === "in_progress"
                  ? `In Progress (${inProgressCount})`
                  : `${st} (${services.filter((s) => s.status === st).length})`}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search room, guest name, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#77766c]">
              Loading room service requests...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#77766c]">
              No service requests found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#efe8dc]/50 text-[#77766c] font-mono uppercase text-[10px] tracking-wider border-b border-[#20352b]/10">
                  <tr>
                    <th className="px-5 py-3.5">Room & Guest</th>
                    <th className="px-4 py-3.5">Service Requested</th>
                    <th className="px-4 py-3.5">Qty / Notes</th>
                    <th className="px-4 py-3.5">Requested Time</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20352b]/5">
                  {filteredServices.map((req) => (
                    <tr key={req.id} className="hover:bg-[#efe8dc]/20 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#20352b] block">
                          {req.room_number}
                        </span>
                        <span className="text-[11px] text-[#77766c]">
                          {req.guest_name || "Stay Guest"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-[#20352b]">
                        {req.service_type}
                      </td>
                      <td className="px-4 py-4 text-[#77766c]">
                        <span className="font-mono text-xs text-[#20352b]">
                          Qty: {req.quantity}
                        </span>
                        {req.notes && (
                          <div className="text-[11px] text-[#77766c] italic mt-0.5 max-w-xs truncate">
                            “{req.notes}”
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-[#77766c]">
                        {req.created_at
                          ? new Date(req.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) +
                            ", " +
                            new Date(req.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : "Today"}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={req.status}
                          disabled={updating === req.id}
                          onChange={(e) =>
                            handleStatusChange(
                              req.id,
                              e.target.value as "pending" | "in_progress" | "completed" | "cancelled"
                            )
                          }
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase font-mono border-0 focus:ring-1 focus:ring-[#20352b] cursor-pointer ${
                            STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 size={15} />
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

      {/* New Service Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Room Service Request"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-[#20352b]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Room Number *</label>
              <select
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="w-full bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#20352b]"
                required
              >
                <option value="Room 101 — Casa Luz">Room 101 — Casa Luz (House of Light)</option>
                <option value="Room 102 — Casa Sereno">Room 102 — Casa Sereno (Calm and Peaceful)</option>
                <option value="Room 105 — Casa Sol">Room 105 — Casa Sol (Sunshine Room)</option>
                <option value="Room 103 — Casa Luna">Room 103 — Casa Luna (Moonlight Room)</option>
                <option value="Room 104 — Casa Amore">Room 104 — Casa Amore (Romantic & Cozy)</option>
                <option value="Dining / Lounge">Main Lounge</option>
                <option value="Open Patio Terrace">Open Patio Terrace</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Guest Name (Optional)</label>
              <input
                type="text"
                placeholder="Guest name"
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                className="w-full bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#20352b]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Service Type *</label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#20352b]"
              required
            >
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="w-full bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Special Instructions / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Please deliver before 8 AM, extra sugar sachets requested"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="button button-quiet px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-4 py-2 text-xs">
              Save Service Request
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

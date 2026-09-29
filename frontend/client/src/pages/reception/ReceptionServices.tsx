import React, { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import Modal from "@/components/admin/Modal";
import {
  Coffee,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  BedDouble,
  Sparkles,
  Droplets,
  PackageCheck,
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

export default function ReceptionServices() {
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

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const data = await fetchServices();
      setServices(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room service requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: number, status: string) {
    setUpdating(id);
    try {
      await updateServiceStatus(id, status);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: status as any } : s))
      );
      toast.success(`Request status updated to ${status.replace("_", " ")}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to remove this service request?")) return;
    try {
      await deleteServiceRequest(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service request removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete request.");
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guest_name.trim()) {
      toast.error("Guest name is required.");
      return;
    }

    try {
      await createServiceRequest(formData);
      toast.success("Room service request registered!");
      setIsModalOpen(false);
      setFormData({
        room_number: "Room 101",
        guest_name: "",
        service_type: "Chai & Coffee Sachets Refill (Tea, Coffee, Sugar, Creamer)",
        quantity: 2,
        notes: "",
      });
      loadServices();
    } catch (err) {
      console.error(err);
      toast.error("Failed to register room service request.");
    }
  };

  const filtered = services.filter((s) => {
    const matchSearch =
      s.room_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.request_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.service_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = services.filter(
    (s) => s.status === "pending" || s.status === "in_progress"
  ).length;
  const chaiCoffeeCount = services.filter((s) =>
    s.service_type.toLowerCase().includes("chai") || s.service_type.toLowerCase().includes("coffee")
  ).length;

  return (
    <ReceptionLayout
      title="In-Room Amenities & Room Services"
      subtitle="Kettle assistance, Chai & Coffee sachets, drinking water, and housekeeping for homestay guests"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadServices}
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
            <span>New Service Request</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Total Requests</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{services.length}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-amber-700 block mb-1">Active / Pending</span>
            <span className="text-2xl font-serif font-bold text-amber-800">{pendingCount}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-[#a07840] block mb-1">☕ Chai / Coffee Sachets</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{chaiCoffeeCount}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block mb-1">Completed / Delivered</span>
            <span className="text-2xl font-serif font-bold text-emerald-800">
              {services.filter((s) => s.status === "completed").length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search room number, guest name, or service..."
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
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Services Cards / Grid */}
        {loading ? (
          <div className="text-center py-16 text-[#77766c] text-xs">Loading service requests...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl p-12 text-center">
            <Coffee size={36} className="mx-auto text-[#77766c] mb-3 opacity-40" />
            <p className="font-serif text-lg text-[#20352b] mb-1">No Service Requests Found</p>
            <p className="text-xs text-[#77766c]">No active in-room requests match your filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#c8a36a] font-bold">
                        #{s.request_number}
                      </span>
                      <h3 className="font-serif text-base font-semibold text-[#20352b] mt-0.5">
                        📍 {s.room_number}
                      </h3>
                      <p className="text-xs text-[#77766c]">{s.guest_name}</p>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-semibold ${
                        STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="bg-[#f5f0e8]/80 border border-[#20352b]/8 rounded-2xl p-3 mb-3">
                    <p className="text-xs font-semibold text-[#20352b] flex items-center gap-1.5">
                      <span>{s.service_type}</span>
                    </p>
                    <p className="text-[11px] text-[#77766c] mt-1">
                      Quantity: <span className="font-semibold text-[#20352b]">{s.quantity}</span>
                    </p>
                  </div>

                  {s.notes && (
                    <p className="text-[11px] italic text-[#77766c] mb-3 bg-white/50 p-2 rounded-xl border border-[#20352b]/5">
                      Note: {s.notes}
                    </p>
                  )}

                  <p className="text-[10px] text-[#77766c] font-mono mb-3">
                    Requested:{" "}
                    {s.created_at
                      ? new Date(s.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>

                {/* Status Update & Delete */}
                <div className="pt-2 border-t border-[#20352b]/8 flex items-center justify-between gap-2">
                  <select
                    value={s.status}
                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    disabled={updating === s.id}
                    className="flex-1 text-xs border border-[#20352b]/15 rounded-xl px-3 py-1.5 bg-[#f5f0e8] text-[#20352b] focus:outline-none disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress / Dispatching</option>
                    <option value="completed">Delivered & Complete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 text-[#77766c] hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Request"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New In-Room Service Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New In-Room Service / Amenity Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Room / Suite *</label>
              <select
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                <option value="Room 101 — Casa Luz">Room 101 — Casa Luz (House of Light)</option>
                <option value="Room 102 — Casa Sereno">Room 102 — Casa Sereno (Calm and Peaceful)</option>
                <option value="Room 105 — Casa Sol">Room 105 — Casa Sol (Sunshine Room)</option>
                <option value="Room 103 — Casa Luna">Room 103 — Casa Luna (Moonlight Room)</option>
                <option value="Room 104 — Casa Amore">Room 104 — Casa Amore (Romantic & Cozy)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Guest Name *</label>
              <input
                type="text"
                required
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
                placeholder="Guest name"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Service / In-Room Item *</label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
            >
              {SERVICE_OPTIONS.map((opt, i) => (
                <option key={i} value={opt.label}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="e.g. Please deliver before 8 AM, extra sugar sachets requested"
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
              Dispatch Service Request
            </button>
          </div>
        </form>
      </Modal>
    </ReceptionLayout>
  );
}

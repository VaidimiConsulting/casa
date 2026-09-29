import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, UserCheck, Shield, Phone, Mail, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
  StaffMember,
} from "@/api/staff";
import { toast } from "sonner";

export default function Staff() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: "",
    email: "",
    phone: "",
    role: "receptionist",
    status: "active",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await fetchStaff();
      setStaffList(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load staff roster.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedStaff(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "receptionist",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData(staff);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill required fields.");
      return;
    }

    try {
      if (selectedStaff) {
        await updateStaff(selectedStaff.id, formData);
        toast.success("Staff profile updated.");
      } else {
        await createStaff(formData);
        toast.success("Staff member added.");
      }
      setIsModalOpen(false);
      loadStaff();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save staff member.");
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    try {
      const nextStatus = staff.status === "active" ? "inactive" : "active";
      await toggleStaffStatus(staff.id, nextStatus);
      toast.success("Staff status updated.");
      loadStaff();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this staff profile?")) return;
    try {
      await deleteStaff(id);
      toast.success("Staff member removed.");
      loadStaff();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete staff member.");
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff Member",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#20352b] text-[#c8a36a] flex items-center justify-center font-serif text-xs font-semibold shrink-0">
            {s.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-sm text-[#20352b] block">{s.name}</span>
            <span className="text-[11px] text-[#77766c]">{s.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role / Permissions",
      render: (s) => (
        <span className="px-2.5 py-0.5 rounded-full bg-[#f5f0e8] text-[11px] font-mono text-[#20352b] border border-[#20352b]/10 capitalize">
          {s.role.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Contact",
      render: (s) => <span className="font-mono text-xs">{s.phone || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Joined Date",
      render: (s) => (
        <span className="text-[11px] text-[#77766c]">
          {new Date(s.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <button
          onClick={() => handleToggleStatus(s)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <StatusBadge status={s.status} />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Edit staff details"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDelete(s.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Remove staff member"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Staff & Access Management"
      subtitle="Manage internal personnel, front desk agents, housekeeping & access roles"
      actions={
        <button
          onClick={handleOpenAdd}
          className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Add Staff Member</span>
        </button>
      }
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={staffList}
          loading={loading}
          searchPlaceholder="Search staff by name, email or role..."
          searchKey={(s) => `${s.name} ${s.email} ${s.role}`}
          filterOptions={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          filterKey={(s) => s.status}
          emptyMessage="No staff members found."
        />
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStaff ? "Edit Staff Details" : "Register New Staff"}
        subtitle="Manage access privileges and contact information"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="staff@casanest.com"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Role & Responsibility
            </label>
            <select
              value={formData.role || "receptionist"}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="receptionist">Receptionist / Front Desk</option>
              <option value="manager">Homestay Manager</option>
              <option value="housekeeping">Housekeeping & Operations</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Status
            </label>
            <select
              value={formData.status || "active"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              <option value="active">Active Staff Member</option>
              <option value="inactive">Inactive / On Leave</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Account
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

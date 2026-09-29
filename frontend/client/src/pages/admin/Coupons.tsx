import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Percent, Calendar, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  Coupon,
} from "@/api/coupons";
import { toast } from "sonner";

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 1000,
    max_discount: 500,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    is_active: 1,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load offers.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedCoupon(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 1000,
      max_discount: 500,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      min_order_amount: Number(coupon.min_order_amount),
      max_discount: coupon.max_discount ? Number(coupon.max_discount) : undefined,
      start_date: coupon.start_date.split("T")[0],
      end_date: coupon.end_date.split("T")[0],
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) {
      toast.error("Code and discount value are required.");
      return;
    }

    try {
      if (selectedCoupon) {
        await updateCoupon(selectedCoupon.id, formData);
        toast.success("Offer updated.");
      } else {
        await createCoupon(formData);
        toast.success("Offer coupon created.");
      }
      setIsModalOpen(false);
      loadCoupons();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save coupon.");
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const nextActive = coupon.is_active ? false : true;
      await toggleCouponStatus(coupon.id, nextActive);
      toast.success("Offer status updated.");
      loadCoupons();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await deleteCoupon(id);
      toast.success("Coupon deleted.");
      loadCoupons();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete coupon.");
    }
  };

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Coupon Code",
      render: (c) => (
        <span className="font-mono font-bold text-sm text-[#20352b] bg-[#f5f0e8] px-2.5 py-1 rounded-md border border-[#20352b]/10">
          {c.code}
        </span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (c) => (
        <span className="font-semibold text-sm text-[#20352b]">
          {c.discount_type === "percentage"
            ? `${c.discount_value}% OFF`
            : `₹${Number(c.discount_value).toLocaleString()} FLAT OFF`}
        </span>
      ),
    },
    {
      key: "min_order_amount",
      header: "Min Spend",
      render: (c) => (
        <span className="font-mono text-xs text-[#77766c]">
          ₹{Number(c.min_order_amount).toLocaleString()}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity Window",
      render: (c) => (
        <span className="text-[11px] font-mono text-[#77766c]">
          {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "times_used",
      header: "Used",
      render: (c) => (
        <span className="font-mono text-xs text-[#20352b]">{c.times_used || 0} times</span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (c) => (
        <button
          onClick={() => handleToggleStatus(c)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <StatusBadge status={c.is_active ? "active" : "inactive"} />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Edit offer"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete coupon"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Offers & Coupon Codes"
      subtitle="Create promotional discounts, seasonal vouchers & booking deals"
      actions={
        <button
          onClick={handleOpenAdd}
          className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>New Promo Code</span>
        </button>
      }
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={coupons}
          loading={loading}
          searchPlaceholder="Search coupons by code or description..."
          searchKey={(c) => `${c.code} ${c.description || ""}`}
          emptyMessage="No promotional coupons found. Create one now."
        />
      </div>

      {/* Add / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCoupon ? "Edit Offer Code" : "Create Promotional Coupon"}
        subtitle="Configure discount rates, minimum spend, and date validity"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                placeholder="e.g. MONSOON25"
                value={formData.code || ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#20352b] uppercase focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Discount Type
              </label>
              <select
                value={formData.discount_type || "percentage"}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                value={formData.discount_value || ""}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Min Spend (₹)
              </label>
              <input
                type="number"
                value={formData.min_order_amount || 0}
                onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Max Cap (₹)
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={formData.max_discount || ""}
                onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) || undefined })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Special festive discount on 2+ night bookings"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
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
              Save Promo Code
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

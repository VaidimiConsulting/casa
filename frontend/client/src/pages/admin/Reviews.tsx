import React, { useEffect, useState, useMemo } from "react";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  User,
  Calendar,
  BedDouble,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import { fetchReviews, toggleReviewApproval, deleteReview, Review } from "@/api/reviews";
import { toast } from "sonner";

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchReviews(false);
      setReviews(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (review: Review) => {
    try {
      const nextApproved = review.is_approved ? false : true;
      await toggleReviewApproval(review.id, nextApproved);
      toast.success(
        nextApproved
          ? `Review by ${review.customer_name} is now visible on website.`
          : `Review by ${review.customer_name} is now hidden from website.`
      );
      loadReviews();
      if (selectedReview?.id === review.id) {
        setSelectedReview({ ...selectedReview, is_approved: nextApproved ? 1 : 0 });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update approval status.");
    }
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      setIsDeleting(true);
      await deleteReview(reviewToDelete.id);
      toast.success(`Review by ${reviewToDelete.customer_name} has been deleted.`);
      setReviewToDelete(null);
      if (selectedReview?.id === reviewToDelete.id) {
        setSelectedReview(null);
      }
      loadReviews();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  // KPIs
  const totalCount = reviews.length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1)
    : "5.0";

  const columns: Column<Review>[] = [
    {
      key: "customer_name",
      header: "Guest Details",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#20352b] text-[#c8a36a] flex items-center justify-center font-bold text-xs shrink-0">
            {r.customer_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm text-[#20352b] block">
              {r.customer_name}
            </span>
            <span className="text-[11px] text-[#77766c] block">
              {r.customer_email || "Direct Website Review"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-0.5 text-[#c8a36a]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < r.rating ? "fill-[#c8a36a] text-[#c8a36a]" : "text-[#77766c]/25"}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-[#77766c]">
            {r.rating} / 5 Stars
          </span>
        </div>
      ),
    },
    {
      key: "review",
      header: "Guest Feedback & Story",
      render: (r) => (
        <div
          onClick={() => setSelectedReview(r)}
          className="cursor-pointer group max-w-sm"
          title="Click to view full review"
        >
          <p className="text-xs text-[#20352b] line-clamp-2 leading-relaxed group-hover:text-[#c8a36a] transition-colors">
            "{r.review}"
          </p>
          <span className="text-[10px] text-[#c8a36a] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Click to read full review →
          </span>
        </div>
      ),
    },
    {
      key: "room_name",
      header: "Room / Experience",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#20352b]">
          <BedDouble size={13} className="text-[#c8a36a] shrink-0" />
          <span className="truncate max-w-[180px]">{r.room_name || "Casa Nest Homestay"}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date Posted",
      render: (r) => (
        <span className="text-[11px] font-mono text-[#77766c]">
          {new Date(r.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "is_approved",
      header: "Website Status",
      render: (r) => (
        <button
          onClick={() => handleToggleApproval(r)}
          className="cursor-pointer hover:opacity-85 transition-opacity"
          title={r.is_approved ? "Click to hide from website" : "Click to approve & display on website"}
        >
          <StatusBadge status={r.is_approved ? "approved" : "hidden"} />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedReview(r)}
            className="p-1.5 rounded-lg text-[#20352b] bg-[#f5f0e8] hover:bg-[#20352b] hover:text-white transition-all cursor-pointer"
            title="View full review"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => handleToggleApproval(r)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              r.is_approved
                ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            }`}
            title={r.is_approved ? "Hide from website" : "Approve for website"}
          >
            {r.is_approved ? <EyeOff size={14} /> : <CheckCircle2 size={14} />}
          </button>
          <button
            onClick={() => setReviewToDelete(r)}
            className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
            title="Delete this review permanently"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Guest Reviews & Testimonials"
      subtitle="Moderate real customer ratings, manage visibility, or delete inappropriate reviews"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadReviews}
            className="button button-light border border-[#20352b]/15 px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Refresh Reviews"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-[#c8a36a]" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Total Reviews</span>
              <strong className="text-base text-[#20352b]">{totalCount} Guest Reviews</strong>
            </div>
            <MessageSquareQuote size={20} className="text-[#c8a36a]" />
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-amber-800 font-semibold block">Average Rating</span>
              <div className="flex items-center gap-1 mt-0.5">
                <strong className="text-base text-amber-900 font-mono">{avgRating}</strong>
                <Star size={14} className="fill-[#c8a36a] text-[#c8a36a]" />
              </div>
            </div>
            <Sparkles size={18} className="text-amber-600" />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-emerald-800 font-semibold block">5-Star Experiences</span>
              <strong className="text-base text-emerald-800 font-mono">
                {fiveStarCount} ({totalCount > 0 ? Math.round((fiveStarCount / totalCount) * 100) : 100}%)
              </strong>
            </div>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Live on Website</span>
              <strong className="text-base text-[#20352b]">
                {approvedCount} Published
              </strong>
            </div>
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
        </div>

        {/* Reviews Data Table */}
        <DataTable
          columns={columns}
          data={reviews}
          loading={loading}
          searchPlaceholder="Search reviews by guest name, room or keywords..."
          searchKey={(r) => `${r.customer_name} ${r.customer_email || ""} ${r.review} ${r.room_name || ""}`}
          filterOptions={[
            { label: "Approved (Live on Website)", value: "1" },
            { label: "Hidden / Pending", value: "0" },
          ]}
          filterKey={(r) => String(r.is_approved)}
          emptyMessage="No customer reviews found. Reviews submitted via website will appear here instantly."
        />
      </div>

      {/* Review Full Details Modal */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Guest Review Details"
        subtitle="Review full customer experience and moderation status"
        maxWidth="md"
      >
        {selectedReview && (
          <div className="space-y-4 text-xs text-[#20352b]">
            <div className="p-4 rounded-2xl bg-[#efe8dc]/50 border border-[#20352b]/10 flex items-center justify-between">
              <div>
                <strong className="text-sm block">{selectedReview.customer_name}</strong>
                <span className="text-[11px] text-[#77766c]">
                  {selectedReview.customer_email || "Guest User"} • {new Date(selectedReview.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-[#c8a36a]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={i < selectedReview.rating ? "fill-[#c8a36a] text-[#c8a36a]" : "text-[#77766c]/25"}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-[#77766c] block">
                Stayed Room / Experience
              </span>
              <div className="p-2.5 rounded-xl bg-white border border-[#20352b]/10 font-semibold text-xs flex items-center gap-2">
                <BedDouble size={14} className="text-[#c8a36a]" />
                <span>{selectedReview.room_name || "Casa Nest General Experience"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-[#77766c] block">
                Full Review & Feedback
              </span>
              <div className="p-3.5 rounded-2xl bg-white border border-[#20352b]/10 text-xs leading-relaxed italic text-[#20352b]">
                "{selectedReview.review}"
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20352b]/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleApproval(selectedReview)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    selectedReview.is_approved
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  {selectedReview.is_approved ? <EyeOff size={13} /> : <CheckCircle2 size={13} />}
                  <span>{selectedReview.is_approved ? "Hide from Website" : "Approve for Website"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReviewToDelete(selectedReview);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 flex items-center gap-1.5 cursor-pointer transition-colors border border-red-200"
              >
                <Trash2 size={13} />
                <span>Delete Review</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        title="Delete Review"
        subtitle="This action cannot be undone"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-[#20352b]">
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <p>
              Kya aap sach me <strong>{reviewToDelete?.customer_name}</strong> ka review permanently delete karna chahte hain?
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setReviewToDelete(null)}
              className="button button-light px-4 py-2 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Trash2 size={13} />
              <span>{isDeleting ? "Deleting..." : "Yes, Delete Permanently"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

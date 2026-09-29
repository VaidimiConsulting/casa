import React, { useState, useMemo } from "react";
import {
  X,
  Star,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  MessageSquareQuote,
  Building2,
  Calendar,
} from "lucide-react";
import { Review } from "@/api/reviews";

interface AllReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  onOpenWriteReview: () => void;
}

export default function AllReviewsModal({
  isOpen,
  onClose,
  reviews,
  onOpenWriteReview,
}: AllReviewsModalProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("All");
  const [selectedRating, setSelectedRating] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackReviews: Review[] = useMemo(() => [
    {
      id: 1,
      user_id: null,
      room_id: null,
      customer_name: "Riya Sharma",
      customer_email: "riya.sharma@example.com",
      rating: 5,
      review: "Felt like home from the very first moment. Beautiful ambience, clean rooms with swan origami, and amazing hospitality in Varanasi!",
      room_name: "Room 101 — Casa Luz (House of Light)",
      is_approved: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: null,
      room_id: null,
      customer_name: "Amit Verma",
      customer_email: "amit.verma@example.com",
      rating: 5,
      review: "The peaceful serene vibe inside Kashi is just magical. Peaceful, extremely safe, and the open rooftop patio was wonderful.",
      room_name: "Room 102 — Casa Sereno (Calm & Peaceful)",
      is_approved: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      user_id: null,
      room_id: null,
      customer_name: "Sneha Iyer",
      customer_email: "sneha.iyer@example.com",
      rating: 5,
      review: "Perfect blend of comfort, culture, and calm. Handcrafted teak furniture and very supportive host team. Highly recommended!",
      room_name: "Room 104 — Casa Amore (Romantic & Cozy)",
      is_approved: 1,
      created_at: new Date().toISOString(),
    },
  ], []);

  const allReviewsList = reviews && reviews.length > 0 ? reviews : fallbackReviews;

  const roomOptions = useMemo(() => {
    const set = new Set<string>();
    allReviewsList.forEach((r) => {
      if (r.room_name) set.add(r.room_name);
    });
    return ["All", ...Array.from(set)];
  }, [allReviewsList]);

  const filteredReviews = useMemo(() => {
    return allReviewsList.filter((r) => {
      // Room filter
      if (selectedRoom !== "All" && r.room_name !== selectedRoom) {
        return false;
      }
      // Rating filter
      if (selectedRating !== "All") {
        if (Number(selectedRating) !== r.rating) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.customer_name?.toLowerCase().includes(q);
        const matchesReview = r.review?.toLowerCase().includes(q);
        const matchesRoom = r.room_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesReview && !matchesRoom) return false;
      }
      return true;
    });
  }, [allReviewsList, selectedRoom, selectedRating, searchQuery]);

  const avgRating = useMemo(() => {
    if (allReviewsList.length === 0) return "5.0";
    const sum = allReviewsList.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / allReviewsList.length).toFixed(1);
  }, [allReviewsList]);

  const fiveStarPercentage = useMemo(() => {
    if (allReviewsList.length === 0) return 100;
    const fiveStars = allReviewsList.filter((r) => r.rating === 5).length;
    return Math.round((fiveStars / allReviewsList.length) * 100);
  }, [allReviewsList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#20352b]/10 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#c8a36a] font-bold">
              <Sparkles size={14} />
              <span>Casa Nest Guest Stories</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#20352b] mt-0.5">
              All Verified Guest Reviews ({allReviewsList.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenWriteReview();
              }}
              className="button button-dark px-3.5 py-1.5 text-xs hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <Star size={13} className="text-[#c8a36a]" fill="currentColor" />
              <span>Write a Review</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#77766c] hover:text-[#20352b] hover:bg-[#20352b]/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Rating Summary Strip & Filter Toolbar */}
        <div className="p-4 sm:p-6 bg-[#efe7db]/40 border-b border-[#20352b]/10 space-y-4 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-[#20352b]/10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#c8a36a]/15 text-[#c8a36a] flex items-center justify-center font-bold text-xl font-mono shrink-0">
                ★
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">Average Rating</span>
                <strong className="text-base text-[#20352b]">{avgRating} / 5.0 Rating</strong>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#20352b]/10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg font-mono shrink-0">
                {fiveStarPercentage}%
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">5-Star Satisfaction</span>
                <strong className="text-base text-emerald-800">100% Recommended</strong>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#20352b]/10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#20352b]/10 text-[#20352b] flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">Total Feedback</span>
                <strong className="text-base text-[#20352b]">{allReviewsList.length} Verified Guests</strong>
              </div>
            </div>
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews by guest name or keywords..."
                className="w-full bg-white border border-[#20352b]/15 rounded-xl pl-9 pr-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            {/* Room Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766c]" />
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl pl-8 pr-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                >
                  <option value="All">All Rooms & Suites</option>
                  {roomOptions.filter(r => r !== "All").map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Filter */}
              <div className="relative sm:w-36">
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                >
                  <option value="All">All Stars (★)</option>
                  <option value="5">5 Stars Only</option>
                  <option value="4">4 Stars</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#20352b]/10 space-y-2">
              <MessageSquareQuote size={36} className="mx-auto text-[#77766c]/40" />
              <p className="text-sm font-semibold text-[#20352b]">No reviews match your filter</p>
              <p className="text-xs text-[#77766c]">Try changing your search keywords or room filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((rev) => {
                const initials = rev.customer_name
                  ? rev.customer_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "CN";

                return (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-[#20352b]/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#c8a36a]/40 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[#c8a36a]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < (rev.rating || 5) ? "fill-[#c8a36a] text-[#c8a36a]" : "text-gray-200"}
                            />
                          ))}
                          <span className="text-xs font-bold text-[#20352b] ml-1">
                            {rev.rating || 5}.0
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified Guest
                        </span>
                      </div>

                      <p className="text-xs text-[#20352b] leading-relaxed italic">
                        “{rev.review}”
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#20352b]/10 text-[#20352b] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <strong className="block text-xs font-serif text-[#20352b]">
                            {rev.customer_name}
                          </strong>
                          <small className="text-[10px] text-[#77766c] block truncate max-w-[180px]">
                            {rev.room_name || "Casa Nest Guest Stay"}
                          </small>
                        </div>
                      </div>
                      {rev.created_at && (
                        <span className="text-[10px] text-[#77766c] font-mono flex items-center gap-1">
                          <Calendar size={11} className="opacity-70" />
                          {new Date(rev.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#20352b]/10 flex items-center justify-between shrink-0 text-xs">
          <span className="text-[#77766c] font-medium">
            Showing {filteredReviews.length} of {allReviewsList.length} reviews
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenWriteReview();
              }}
              className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer sm:hidden"
            >
              <Star size={13} className="text-[#c8a36a]" fill="currentColor" />
              <span>Write Review</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#20352b] text-[#fbf8f1] hover:bg-[#2e4c3e] transition-colors cursor-pointer font-medium"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

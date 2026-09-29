import React, { useState } from "react";
import { X, Star, MessageSquareQuote, CheckCircle2, Heart, Sparkles, Send } from "lucide-react";
import { createReview } from "@/api/reviews";
import { toast } from "sonner";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
  defaultName?: string;
  defaultEmail?: string;
  userId?: number;
}

const RATING_LABELS: Record<number, string> = {
  5: "5 Stars — Exceptional & Unforgettable! ⭐⭐⭐⭐⭐",
  4: "4 Stars — Wonderful & Peaceful Stay ⭐⭐⭐⭐",
  3: "3 Stars — Good Experience ⭐⭐⭐",
  2: "2 Stars — Average ⭐⭐",
  1: "1 Star — Needs Improvement ⭐",
};

const ROOM_OPTIONS = [
  "Room 101 — Casa Luz (House of Light)",
  "Room 102 — Casa Sereno (Calm & Peaceful)",
  "Room 105 — Casa Sol (Sunshine Room)",
  "Room 103 — Casa Luna (Moonlight Room)",
  "Room 104 — Casa Amore (Romantic & Cozy)",
  "Open Patio & Terrace Garden",
  "Casa Nest General Experience",
];

export default function WriteReviewModal({
  isOpen,
  onClose,
  onReviewSubmitted,
  defaultName = "",
  defaultEmail = "",
  userId,
}: WriteReviewModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [roomStayed, setRoomStayed] = useState(ROOM_OPTIONS[0]);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter your name (at least 2 characters).");
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 5) {
      toast.error("Please write a few words about your stay experience.");
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        user_id: userId || undefined,
        customer_name: name.trim(),
        customer_email: email.trim() || undefined,
        rating,
        review: reviewText.trim(),
        room_name: roomStayed,
      });

      setSubmitted(true);
      toast.success("Thank you! Your review has been submitted.");
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setReviewText("");
    onClose();
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden z-10 flex flex-col max-h-[92dvh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#20352b] text-[#fbf8f1] shrink-0 border-b border-[#fbf8f1]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c8a36a]/20 text-[#c8a36a] flex items-center justify-center shrink-0">
              <MessageSquareQuote size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base tracking-wide text-white">
                Share Your Experience
              </h3>
              <span className="text-[11px] text-white/80 block font-sans">
                Casa Nest Homestay Guest Review
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4 text-[#20352b]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="font-serif text-2xl font-bold">Review Submitted!</h4>
            <p className="text-xs text-[#77766c] max-w-sm mx-auto leading-relaxed">
              Thank you for sharing your experience at Casa Nest. Your story helps fellow travellers and inspires us to host with warmth.
            </p>
            <div className="pt-2">
              <button
                onClick={handleClose}
                className="button button-dark px-6 py-2.5 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#20352b] overflow-y-auto">
            {/* Interactive Star Rating */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] font-semibold mb-1.5">
                Your Rating *
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 p-2 bg-[#efe8dc]/60 rounded-2xl border border-[#20352b]/10">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`${star} Stars`}
                    >
                      <Star
                        size={22}
                        className={
                          star <= displayRating
                            ? "fill-[#c8a36a] text-[#c8a36a]"
                            : "text-[#77766c]/30"
                        }
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-medium text-[#c8a36a] italic">
                  {RATING_LABELS[displayRating] || "Select Stars"}
                </span>
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
            </div>

            {/* Room stayed */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                Room / Experience Stayed
              </label>
              <select
                value={roomStayed}
                onChange={(e) => setRoomStayed(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                {ROOM_OPTIONS.map((rm) => (
                  <option key={rm} value={rm}>
                    {rm}
                  </option>
                ))}
              </select>
            </div>

            {/* Review text */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                Your Review & Story *
              </label>
              <textarea
                rows={4}
                required
                placeholder="What did you love most about your stay? (e.g. The sunlit rooms, soothing Ganga aarti guide, warm hospitality, serene garden patio...)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b] resize-none leading-relaxed"
              />
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-between">
              <small className="text-[10px] text-[#77766c] flex items-center gap-1">
                <Sparkles size={12} className="text-[#c8a36a]" /> Direct homestay guest feedback
              </small>
              <button
                type="submit"
                disabled={submitting}
                className="button button-dark px-5 py-2.5 text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Send size={13} />
                <span>{submitting ? "Submitting..." : "Post Review"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

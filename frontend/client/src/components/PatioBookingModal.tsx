import React, { useState } from "react";
import {
  X,
  PartyPopper,
  Calendar,
  Clock,
  Users,
  Utensils,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  User,
  ArrowRight,
  Info,
} from "lucide-react";
import { bookPatioEvent } from "@/api/patio";
import { toast } from "sonner";

interface PatioBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHostName?: string;
  defaultHostEmail?: string;
}

const EVENT_TYPES = [
  "Dinner Party",
  "Birthday Party",
  "Small Family Gathering",
  "Corporate Party / Mixer",
  "Casual Get Together",
  "Anniversary Celebration",
];

const TIME_SLOTS = [
  { label: "Evening Celebration (6:00 PM – 11:00 PM)", highlight: "Fairy Lights & Starlit Twilight" },
  { label: "Morning / Lunch Slot (11:00 AM – 3:00 PM)", highlight: "Sunlit Rooftop Brunch" },
  { label: "Full Day Access (10:00 AM – 11:00 PM)", highlight: "Exclusive All-Day Patio Buyout" },
];

export default function PatioBookingModal({
  isOpen,
  onClose,
  defaultHostName = "",
  defaultHostEmail = "",
}: PatioBookingModalProps) {
  if (!isOpen) return null;

  // Form State
  const [hostName, setHostName] = useState(defaultHostName);
  const [hostEmail, setHostEmail] = useState(defaultHostEmail);
  const [hostPhone, setHostPhone] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState("");
  const [timeSlotIndex, setTimeSlotIndex] = useState(0);
  const selectedSlot = TIME_SLOTS[timeSlotIndex] || TIME_SLOTS[0];
  const [guestCount, setGuestCount] = useState<number>(30);
  const [foodRequired, setFoodRequired] = useState<boolean>(true);
  const [foodPreferences, setFoodPreferences] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameVal = hostName.trim();
    const emailVal = hostEmail.trim();
    const phoneVal = hostPhone.trim();

    if (!nameVal || nameVal.length < 2) {
      toast.error("Please enter a valid host name (at least 2 characters).");
      return;
    }

    if (!emailVal || !EMAIL_REGEX.test(emailVal)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!phoneVal || !PHONE_REGEX.test(phoneVal)) {
      toast.error("Please enter a valid 10-15 digit phone number.");
      return;
    }

    if (!eventDate) {
      toast.error("Please select an event date.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (eventDate < todayStr) {
      toast.error("Event date cannot be in the past.");
      return;
    }

    if (guestCount < 12 || guestCount > 18) {
      toast.error("Open Patio capacity is between 12 to 18 guests.");
      return;
    }

    try {
      setSubmitting(true);
      const foodSummary = foodRequired
        ? `Food Catering Required${foodPreferences.trim() ? `: ${foodPreferences.trim()}` : ""}`
        : "Venue Only (No Food Catering)";

      const res = await bookPatioEvent({
        host_name: nameVal,
        host_email: emailVal,
        host_phone: phoneVal,
        event_type: eventType,
        event_date: eventDate,
        time_slot: selectedSlot.label,
        guest_count: guestCount,
        food_menu_type: foodSummary,
        special_requests: specialRequests.trim() || undefined,
      });

      if (res.success) {
        setConfirmedRef(res.bookingRef);
        toast.success("Patio event booking enquiry submitted successfully!");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.response?.data?.message || "Failed to submit booking request. Please check details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedRef(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Modal Dialog Card - Never cut off, fully responsive */}
      <div className="relative w-full max-w-2xl bg-[#fbf8f1] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden z-10 flex flex-col max-h-[92dvh] sm:max-h-[88dvh] my-auto">
        {/* Sticky Header - Always visible with Close button */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 bg-[#20352b] text-[#fbf8f1] shrink-0 border-b border-[#fbf8f1]/10 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c8a36a]/20 text-[#c8a36a] flex items-center justify-center shrink-0">
              <PartyPopper size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base tracking-wide text-white">
                Book Open Patio & Terrace Garden
              </h3>
              <span className="text-[11px] text-[#fbf8f1]/70 block font-sans">
                Intimate Celebrations for 12–18 Members
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body - Smooth internal scroll on all devices */}
        {confirmedRef ? (
          /* Confirmation State */
          <div className="p-6 sm:p-10 text-center space-y-4 text-[#20352b] overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="font-serif text-2xl font-bold">Booking Enquiry Submitted!</h4>
            <p className="text-xs text-[#77766c] max-w-md mx-auto leading-relaxed">
              Aapka Open Patio event request register ho gaya hai. Casa Nest host team aapse contact karke date availability, food menu aur finalized quotation share karegi.
            </p>

            <div className="bg-[#f5f0e8] p-4 rounded-2xl max-w-sm mx-auto text-left text-xs font-mono space-y-1.5 border border-[#20352b]/10">
              <div className="text-[10px] text-[#77766c] uppercase">Booking Reference ID</div>
              <strong className="text-base text-[#20352b] block">{confirmedRef}</strong>
              <div className="text-[11px] text-[#77766c]">
                Event: {eventType} ({guestCount} Guests)
              </div>
              <div className="text-[11px] text-[#77766c]">
                Date: {eventDate} • {selectedSlot.label.split("(")[0].trim()}
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold">
                Catering: {foodRequired ? "Food Catering Requested" : "Venue Only"}
              </div>
            </div>

            <div className="pt-3">
              <button onClick={handleClose} className="button button-dark px-6 py-2.5 text-xs">
                Done & Close
              </button>
            </div>
          </div>
        ) : (
          /* Form without price tags - Internal scroll enabled */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5 text-xs text-[#20352b] overflow-y-auto flex-1 overscroll-contain">
            {/* Host Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                  Host Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={hostPhone}
                  onChange={(e) => setHostPhone(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
            </div>

            {/* Event Details: Type, Date & Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                  Event Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                  Guests (Capacity: 12–18) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={12}
                    max={18}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.min(18, Math.max(12, Number(e.target.value))))}
                    className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] font-semibold focus:outline-none focus:border-[#20352b]"
                  />
                  <span className="text-[11px] text-[#77766c] font-mono whitespace-nowrap">
                    / 18 max
                  </span>
                </div>
              </div>
            </div>

            {/* Time Slot Selection (No Prices) */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1.5">
                Time Slot & Ambiance *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot, idx) => (
                  <div
                    key={slot.label}
                    onClick={() => setTimeSlotIndex(idx)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      timeSlotIndex === idx
                        ? "bg-[#20352b] text-[#fbf8f1] border-[#20352b] shadow-xs"
                        : "bg-white text-[#20352b] border-[#20352b]/15 hover:bg-[#f5f0e8]"
                    }`}
                  >
                    <div className="font-semibold text-xs leading-snug">{slot.label}</div>
                    <div className="text-[11px] opacity-75 mt-1">{slot.highlight}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Food & Catering Section (Food Milega - No Price) */}
            <div className="p-4 rounded-2xl bg-white border border-[#20352b]/12 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils size={15} className="text-[#c8a36a]" />
                  <div>
                    <span className="font-semibold text-xs text-[#20352b] block">
                      Breakfast & Snacks Service Available
                    </span>
                    <span className="text-[11px] text-[#77766c]">
                      Fresh in-house food prepared by our chef for your celebration
                    </span>
                  </div>
                </div>
              </div>

              {/* Yes / No Toggle for Catering */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div
                  onClick={() => setFoodRequired(true)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    foodRequired
                      ? "bg-emerald-950 text-white border-emerald-900 shadow-2xs"
                      : "bg-[#fbf8f1] text-[#20352b] border-[#20352b]/15 hover:bg-[#f5f0e8]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    foodRequired ? "border-emerald-400 bg-emerald-500 text-white" : "border-zinc-400"
                  }`}>
                    {foodRequired && <CheckCircle2 size={12} />}
                  </div>
                  <div>
                    <strong className="text-xs block">Yes, Breakfast & Snacks Required</strong>
                    <span className="text-[10px] opacity-80 block leading-tight mt-0.5">
                      Only breakfast and snacks are provided (no main meals)
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setFoodRequired(false)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    !foodRequired
                      ? "bg-emerald-950 text-white border-emerald-900 shadow-2xs"
                      : "bg-[#fbf8f1] text-[#20352b] border-[#20352b]/15 hover:bg-[#f5f0e8]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    !foodRequired ? "border-emerald-400 bg-emerald-500 text-white" : "border-zinc-400"
                  }`}>
                    {!foodRequired && <CheckCircle2 size={12} />}
                  </div>
                  <div>
                    <strong className="text-xs block">No, Venue Only Booking</strong>
                    <span className="text-[10px] opacity-80 block leading-tight mt-0.5">
                      Open patio space reservation without catering
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Food Preference Input */}
              {foodRequired && (
                <div className="pt-2">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#77766c] mb-1">
                    Food & Menu Preferences (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Evening tea & snacks, Desserts..."
                    value={foodPreferences}
                    onChange={(e) => setFoodPreferences(e.target.value)}
                    className="w-full bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                  />
                </div>
              )}
            </div>

            {/* Special Notes */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-[#77766c] mb-1">
                Special Requests / Music / Decor Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Birthday cake table, specific music playlist, fairy light canopy preferences..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            {/* Admin Quotation Note & Submit Button (No Rates Shown) */}
            <div className="p-4 rounded-2xl bg-[#20352b] text-[#fbf8f1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#c8a36a] text-xs font-semibold">
                  <Info size={14} />
                  <span>Personalized Package Quotation</span>
                </div>
                <p className="text-[11px] text-[#fbf8f1]/80 max-w-md leading-relaxed">
                  Booking rates aur catering menu ka price aapke event type aur requirements ke mutabiq Homestay Admin finalize karke aapse directly share karenge.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="button button-light bg-[#c8a36a] hover:bg-[#d8b57d] text-[#20352b] font-semibold px-6 py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0"
              >
                <span>{submitting ? "Sending Request..." : "Submit Event Enquiry"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

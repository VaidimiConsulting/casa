import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  ArrowLeft,
  Users,
  BedDouble,
  Phone,
  MessageCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Printer,
  CreditCard,
  User,
  Lock,
  Receipt,
  FileText,
  MapPin,
  Check,
  HelpCircle,
  PlusCircle,
  Minus,
  Plus,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  BookMarked,
  MessageSquareQuote,
} from "lucide-react";
import { getCurrentUser, logout, updateProfile, getProfile, AuthUser } from "@/api/auth";
import { getBookings, cancelBooking, createBooking, fetchRoomBookedDates, Booking } from "@/api/bookings";
import { fetchRooms, Room } from "@/api/rooms";
import BookingInvoiceModal from "@/components/BookingInvoiceModal";
import WriteReviewModal from "@/components/WriteReviewModal";
import { toast } from "sonner";

const logoPath = "/logo.png";

export default function MyBookings() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stays" | "book" | "library" | "profile" | "support">("stays");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Selected booking for invoice modal and payment modal
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Book Stay Form State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0);
  const [bookCheckIn, setBookCheckIn] = useState("");
  const [bookCheckOut, setBookCheckOut] = useState("");
  const [bookGuests, setBookGuests] = useState(2);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [datesConflict, setDatesConflict] = useState(false);
  const [newlyCreatedBooking, setNewlyCreatedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error("Please sign in to access your guest portal.");
      setLocation("/login");
      return;
    }
    setUser(currentUser);
    setProfileName(currentUser.name || "");
    setProfilePhone(currentUser.phone || "");
    loadMyBookings();
    refreshProfile();
    loadRooms();
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await getProfile();
      if (res.user) {
        setUser(res.user);
        setProfileName(res.user.name || "");
        setProfilePhone(res.user.phone || "");
      }
    } catch {
      // Ignore if silent fail
    }
  };

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (error) {
      console.error("Error loading user bookings:", error);
      toast.error("Could not load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      setRoomsLoading(true);
      const data = await fetchRooms("available");
      setRooms(data);
      if (data.length > 0 && selectedRoomId === 0) {
        setSelectedRoomId(data[0].id);
      }
    } catch {
      // Silently fail, rooms will just not show
    } finally {
      setRoomsLoading(false);
    }
  };

  // Check date conflicts when room or dates change
  useEffect(() => {
    if (!selectedRoomId || !bookCheckIn || !bookCheckOut) {
      setDatesConflict(false);
      return;
    }
    const checkConflict = async () => {
      try {
        const booked = await fetchRoomBookedDates(selectedRoomId);
        const inDate = new Date(bookCheckIn).getTime();
        const outDate = new Date(bookCheckOut).getTime();
        const conflict = booked.some((range) => {
          const bIn = new Date(range.check_in).getTime();
          const bOut = new Date(range.check_out).getTime();
          return inDate < bOut && outDate > bIn && (range.status === "confirmed" || range.status === "pending");
        });
        setDatesConflict(conflict);
      } catch {
        setDatesConflict(false);
      }
    };
    checkConflict();
  }, [selectedRoomId, bookCheckIn, bookCheckOut]);

  const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

  const submitBookingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (datesConflict) {
      toast.error("Selected dates are already booked for this room. Please choose different dates.");
      return;
    }
    if (!bookCheckIn || !bookCheckOut) {
      toast.error("Please select both check-in and check-out dates.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (bookCheckIn < todayStr) {
      toast.error("Check-in date cannot be in the past.");
      return;
    }

    if (bookCheckOut <= bookCheckIn) {
      toast.error("Check-out date must be after check-in date.");
      return;
    }

    if (bookGuests < 1 || bookGuests > 10) {
      toast.error("Guest count must be between 1 and 10.");
      return;
    }

    try {
      setBookingSubmitting(true);
      const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
      const res = await createBooking({
        room_id: selectedRoomId,
        guest_name: user.name || "Guest",
        guest_email: user.email,
        guest_phone: user.phone || undefined,
        check_in: bookCheckIn,
        check_out: bookCheckOut,
        guests: bookGuests,
        notes: selectedRoom ? `Room preference: ${selectedRoom.name}` : undefined,
      });

      const nights = Math.max(
        1,
        Math.ceil((new Date(bookCheckOut).getTime() - new Date(bookCheckIn).getTime()) / (1000 * 60 * 60 * 24))
      );
      const pricePerNight = Number(selectedRoom?.price_per_night || 3500);

      const freshBooking: Booking = {
        id: res.bookingId,
        user_id: user.id,
        room_id: selectedRoomId,
        guest_name: user.name || "Guest",
        guest_email: user.email,
        guest_phone: user.phone || undefined,
        check_in: bookCheckIn,
        check_out: bookCheckOut,
        guests: bookGuests,
        total_amount: res.total_amount || (pricePerNight * nights),
        status: "pending",
        payment_status: "pending",
        created_at: new Date().toISOString(),
        room_name: selectedRoom?.name || "Casa Nest Room",
        room_type: selectedRoom?.room_type || "Deluxe Room",
        price_per_night: pricePerNight,
        payment_method: "Pay at Front Desk (Cash / UPI)",
      };

      setNewlyCreatedBooking(freshBooking);
      setSelectedInvoiceBooking(freshBooking);
      setBookingSuccess(true);
      toast.success("Stay booked successfully! Voucher generated.");
      loadMyBookings();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setDatesConflict(true);
        toast.error("These dates are already reserved. Please pick another date or room.");
      } else {
        toast.error(err.response?.data?.message || "Failed to submit booking. Please try again.");
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm("Are you sure you wish to cancel this booking enquiry?")) {
      return;
    }

    try {
      setCancellingId(id);
      await cancelBooking(id);
      toast.success("Booking enquiry cancelled successfully.");
      loadMyBookings();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = profileName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error("Please enter a valid name (at least 2 characters).");
      return;
    }

    const trimmedPhone = profilePhone.trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      toast.error("Please enter a valid 10-15 digit phone number.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    try {
      setProfileUpdating(true);
      const res = await updateProfile({
        name: trimmedName,
        phone: trimmedPhone || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setUser(res.user);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    setLocation("/");
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "active") return b.status === "confirmed" || b.status === "pending";
    if (filter === "completed") return b.status === "completed" || b.status === "cancelled";
    return true;
  });

  const activeCount = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const totalSpent = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#20352b] font-sans antialiased selection:bg-[#c8a36a]/30">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#fbf8f1]/90 backdrop-blur-md border-b border-[#20352b]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={logoPath}
                alt="Casa Nest"
                className="w-10 h-10 object-contain mix-blend-multiply scale-125"
              />
              <div>
                <span className="font-serif text-lg font-bold text-[#20352b] block leading-none">
                  Casa Nest
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-semibold">
                  Guest Portal & Dashboard
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c8a36a]/15 border border-[#c8a36a]/30 text-xs font-semibold text-[#20352b] hover:bg-[#c8a36a]/25 transition-colors cursor-pointer"
            >
              <MessageSquareQuote size={13} className="text-[#c8a36a]" />
              <span>Write a Review</span>
            </button>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Homestay Website</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer shadow-xs"
              title="Log out from Guest Portal"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden bg-[#20352b] text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-[#20352b]/20">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#c8a36a]/25 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#c8a36a]/40 text-[#f6d79e] text-xs font-semibold uppercase font-mono tracking-wider">
              <Sparkles size={13} className="text-[#f6d79e]" />
              <span>Guest Portal • Kashi</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white">
              Namaste, {user?.name || "Guest"}
            </h1>
            <p className="text-xs sm:text-sm text-[#f5f1e8] max-w-xl font-normal leading-relaxed">
              Track your reservation dates, check-in timings, itemized billing breakdown, payment status, and download official stay vouchers.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-white">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-white shadow-xs">
                <ShieldCheck size={14} className="text-[#f6d79e]" />
                <span>Zero Advance Fees • Settle at Front Desk (Cash / UPI)</span>
              </div>
              <a
                href="https://wa.me/918400095434"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 rounded-full text-white hover:text-[#f6d79e] transition-colors shadow-xs"
              >
                <MessageCircle size={14} className="text-emerald-400" />
                <span>Host Helpline: WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#20352b]/15 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-mono font-semibold uppercase text-[#50574d] block tracking-wide">Total Stays Booked</span>
            <span className="font-serif text-2xl font-bold text-[#1a2f23] mt-1 block">{bookings.length}</span>
          </div>
          <div className="bg-white border border-[#20352b]/15 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-mono font-semibold uppercase text-[#50574d] block tracking-wide">Active / Upcoming</span>
            <span className="font-serif text-2xl font-bold text-emerald-700 mt-1 block">{activeCount}</span>
          </div>
          <div className="bg-white border border-[#20352b]/15 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-mono font-semibold uppercase text-[#50574d] block tracking-wide">Completed Stays</span>
            <span className="font-serif text-2xl font-bold text-blue-700 mt-1 block">{completedCount}</span>
          </div>
          <div className="bg-white border border-[#20352b]/15 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-mono font-semibold uppercase text-[#50574d] block tracking-wide">Total Amount</span>
            <span className="font-serif text-2xl font-bold text-[#9e6d27] mt-1 block">
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex items-center justify-between border-b border-[#20352b]/15 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("stays")}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "stays"
                  ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                  : "bg-[#fbf8f1] border border-[#20352b]/15 text-[#20352b] hover:bg-[#efe7db]"
              }`}
            >
              <BedDouble size={14} />
              <span>My Reservations ({bookings.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab("book"); setBookingSuccess(false); }}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "book"
                  ? "bg-[#c8a36a] text-[#20352b] shadow-md"
                  : "bg-[#fbf8f1] border border-[#c8a36a]/40 text-[#20352b] hover:bg-[#c8a36a]/15"
              }`}
            >
              <PlusCircle size={14} />
              <span>Book a Stay</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "profile"
                  ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                  : "bg-[#fbf8f1] border border-[#20352b]/15 text-[#20352b] hover:bg-[#efe7db]"
              }`}
            >
              <User size={14} />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("support")}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "support"
                  ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                  : "bg-[#fbf8f1] border border-[#20352b]/15 text-[#20352b] hover:bg-[#efe7db]"
              }`}
            >
              <HelpCircle size={14} />
              <span>Host Helpline</span>
            </button>
          </div>

          <div className="flex items-center gap-2" />
        </div>

        {/* TAB 1: RESERVATIONS & STAYS */}
        {activeTab === "stays" && (
          <div className="space-y-6">
            {/* Filter Subtabs and Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filter === "all" ? "bg-[#20352b] text-[#fbf8f1]" : "text-[#77766c] hover:text-[#20352b]"
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filter === "active" ? "bg-[#20352b] text-[#fbf8f1]" : "text-[#77766c] hover:text-[#20352b]"
                  }`}
                >
                  Active & Upcoming ({activeCount})
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filter === "completed" ? "bg-[#20352b] text-[#fbf8f1]" : "text-[#77766c] hover:text-[#20352b]"
                  }`}
                >
                  Completed / Cancelled
                </button>
              </div>

              <button
                onClick={loadMyBookings}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fbf8f1] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors cursor-pointer self-start"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span>Refresh Bookings</span>
              </button>
            </div>

            {/* Bookings List */}
            {loading ? (
              <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl p-16 text-center text-xs text-[#77766c]">
                <RefreshCw size={24} className="animate-spin mx-auto mb-3 opacity-60 text-[#20352b]" />
                <p className="font-serif text-base text-[#20352b]">Loading your reservations...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white border border-[#20352b]/15 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#c8a36a]/15 text-[#9e6d27] flex items-center justify-center mx-auto mb-2">
                  <BedDouble size={36} className="text-[#9e6d27]" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#1a2f23] font-bold">
                  {filter === "all"
                    ? "No Reservations Found"
                    : filter === "active"
                    ? "No Active Stays"
                    : "No Completed Stays"}
                </h3>
                <p className="text-xs sm:text-sm text-[#4d544a] max-w-md mx-auto leading-relaxed">
                  Reserve a luminous stay in Kashi. Choose between Room 101 Casa Luz, Room 102 Casa Sereno, Room 103 Casa Luna, Room 104 Casa Amore, or Room 105 Casa Sol.
                </p>
                <div className="pt-2">
                  <Link
                    href="/#booking"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#20352b] text-white font-semibold text-xs hover:bg-[#2c473a] transition-all shadow-md cursor-pointer hover:shadow-lg"
                  >
                    <span className="text-white font-semibold">Check Room Availability & Book</span>
                    <ChevronRight size={15} className="text-[#f6d79e]" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredBookings.map((booking) => {
                  const checkIn = new Date(booking.check_in);
                  const checkOut = new Date(booking.check_out);
                  const nights = Math.max(
                    1,
                    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                  );
                  const pricePerNight = booking.price_per_night
                    ? Number(booking.price_per_night)
                    : Math.round(Number(booking.total_amount) / nights);
                  const isPaid = booking.payment_status === "paid";

                  return (
                    <div
                      key={booking.id}
                      className="bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col xl:flex-row xl:items-start justify-between gap-6"
                    >
                      {/* Left: Room & Dates & Timings */}
                      <div className="space-y-4 flex-1">
                        {/* Top Badge row */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-[11px] uppercase font-bold tracking-widest bg-[#20352b]/8 px-2.5 py-0.5 rounded-md text-[#20352b]">
                            Reservation #CN-{String(booking.id).padStart(5, "0")}
                          </span>
                          {booking.status === "confirmed" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-semibold font-mono uppercase">
                              <CheckCircle2 size={12} /> Confirmed Stay
                            </span>
                          )}
                          {booking.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold font-mono uppercase">
                              <Clock size={12} /> Enquiry Under Review
                            </span>
                          )}
                          {booking.status === "completed" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold font-mono uppercase">
                              <CheckCircle2 size={12} /> Completed Stay
                            </span>
                          )}
                          {booking.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-semibold font-mono uppercase">
                              <XCircle size={12} /> Cancelled
                            </span>
                          )}

                          {/* Payment status badge */}
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold font-mono uppercase">
                              <CreditCard size={11} /> Paid in Full
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold font-mono uppercase">
                              Pay at Front Desk
                            </span>
                          )}
                        </div>

                        {/* Room Info */}
                        <div>
                          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#20352b]">
                            {booking.room_name || "Casa Nest Homestay Suite"}
                          </h3>
                          {booking.room_type && (
                            <p className="text-xs text-[#77766c] font-medium">{booking.room_type}</p>
                          )}
                        </div>

                        {/* Stay Schedule: Dates & Standard Timing */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div className="bg-[#f5f0e8] p-3 rounded-2xl border border-[#20352b]/8">
                            <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                              Check-In Date
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#20352b] block mt-0.5">
                              {checkIn.toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[11px] font-semibold text-[#c8a36a] block mt-1">
                              Time: From 12:00 PM
                            </span>
                          </div>

                          <div className="bg-[#f5f0e8] p-3 rounded-2xl border border-[#20352b]/8">
                            <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                              Check-Out Date
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#20352b] block mt-0.5">
                              {checkOut.toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[11px] font-semibold text-[#c8a36a] block mt-1">
                              Time: Until 11:00 AM
                            </span>
                          </div>

                          <div className="bg-[#f5f0e8] p-3 rounded-2xl border border-[#20352b]/8">
                            <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                              Stay Duration
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#20352b] flex items-center gap-1 mt-0.5">
                              <CalendarDays size={13} className="text-[#c8a36a]" />
                              {nights} {nights === 1 ? "Night" : "Nights"}
                            </span>
                            <span className="text-[10px] text-[#77766c] block mt-1">
                              {booking.guests} Guest(s)
                            </span>
                          </div>

                          <div className="bg-[#f5f0e8] p-3 rounded-2xl border border-[#20352b]/8">
                            <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                              Booked On
                            </span>
                            <span className="text-xs font-semibold text-[#20352b] block mt-0.5">
                              {new Date(booking.created_at || Date.now()).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[10px] text-[#77766c] block mt-1">
                              {new Date(booking.created_at || Date.now()).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Itemized Billing Breakdown & Payment Record */}
                        <div className="bg-[#f5f0e8]/70 p-4 rounded-2xl border border-[#20352b]/10 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-mono text-[11px] text-[#77766c] border-b border-[#20352b]/10 pb-2">
                            <span>Tariff Calculation</span>
                            <span>
                              ₹{pricePerNight.toLocaleString("en-IN")} × {nights} {nights === 1 ? "night" : "nights"} = ₹{(pricePerNight * nights).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[#77766c] text-[11px]">
                            <span>Taxes & Homestay Service</span>
                            <span className="font-mono">Included in Total</span>
                          </div>
                          <div className="flex items-center justify-between text-[#20352b] font-bold text-sm pt-1 border-t border-[#20352b]/10">
                            <span>Grand Total Amount</span>
                            <span className="font-mono text-base text-[#20352b]">
                              ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                            </span>
                          </div>

                          {/* Payment details */}
                          <div className="pt-2 border-t border-[#20352b]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#77766c]">
                            <div>
                              <span>Payment Mode: </span>
                              <strong className="text-[#20352b]">
                                {booking.payment_method || "Cash / UPI at Check-in"}
                              </strong>
                            </div>
                            {booking.transaction_id && (
                              <div>
                                <span>Ref: </span>
                                <strong className="font-mono text-[#20352b]">{booking.transaction_id}</strong>
                              </div>
                            )}
                            <div>
                              <span>Balance Due: </span>
                              <strong className={isPaid ? "text-emerald-700" : "text-amber-800"}>
                                {isPaid ? "₹0.00 (Paid)" : `₹${Number(booking.total_amount).toLocaleString("en-IN")}`}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {booking.notes && (
                          <p className="text-xs text-[#77766c] italic bg-[#f5f0e8]/40 p-2.5 rounded-xl">
                            Special Request: "{booking.notes}"
                          </p>
                        )}
                      </div>

                      {/* Right: Actions Column */}
                      <div className="xl:w-64 xl:border-l xl:border-[#20352b]/10 xl:pl-6 space-y-3 shrink-0">
                        {/* Printable Voucher & Slip Button */}
                        <button
                          onClick={() => setSelectedInvoiceBooking(booking)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#20352b] text-[#fbf8f1] text-xs font-semibold hover:bg-[#2d4b3c] transition-colors cursor-pointer shadow-xs"
                        >
                          <Receipt size={14} className="text-[#c8a36a]" />
                          <span>
                            {isPaid ? "Download / Print Payment Slip" : "View / Print Stay Voucher"}
                          </span>
                        </button>

                        <a
                          href={`https://wa.me/918400095434?text=${encodeURIComponent(
                            `Hello Casa Nest! Regarding my Reservation #CN-${String(booking.id).padStart(
                              5,
                              "0"
                            )} for ${booking.room_name || "room"}. Check-in: ${booking.check_in}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#fbf8f1] border border-[#20352b]/20 text-[#20352b] text-xs font-semibold hover:bg-[#efe7db] transition-colors"
                        >
                          <MessageCircle size={14} className="text-emerald-700" />
                          <span>WhatsApp Front Desk</span>
                        </a>

                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="w-full py-2 px-4 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {cancellingId === booking.id ? "Cancelling..." : "Cancel Reservation"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: BOOK A STAY */}
        {activeTab === "book" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {bookingSuccess ? (
              <div className="bg-white border border-[#20352b]/15 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1a2f23]">
                    Booking Reserved & Voucher Ready!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4d544a] max-w-md mx-auto leading-relaxed mt-1">
                    Aapki reservation request successfully register ho gayi hai (Booking #{newlyCreatedBooking?.id}). Niche diye gaye button par click karke apna official booking slip / PDF invoice download karein.
                  </p>
                </div>

                {newlyCreatedBooking && (
                  <div className="p-4 bg-[#f5f0e8] rounded-2xl text-xs text-[#20352b] border border-[#20352b]/12 max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] text-[#77766c] block font-mono uppercase font-semibold">
                        Voucher #{newlyCreatedBooking.id} • {newlyCreatedBooking.room_name}
                      </span>
                      <span className="font-mono font-bold text-base text-[#20352b]">
                        ₹{Number(newlyCreatedBooking.total_amount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#9e6d27] block font-medium">
                        {newlyCreatedBooking.guests} Guest(s) • {newlyCreatedBooking.check_in} to {newlyCreatedBooking.check_out}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceBooking(newlyCreatedBooking)}
                      className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                    >
                      <Printer size={13} />
                      <span>Download PDF Slip</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button
                    onClick={() => setSelectedInvoiceBooking(newlyCreatedBooking)}
                    className="px-6 py-3 rounded-full bg-[#c8a36a] text-[#20352b] font-bold text-xs hover:bg-[#b8935a] transition-all cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <Printer size={14} />
                    <span>View / Print Booking Slip (PDF)</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("stays"); setBookingSuccess(false); }}
                    className="px-6 py-3 rounded-full bg-[#20352b] text-white font-semibold text-xs hover:bg-[#2c473a] transition-all cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <BedDouble size={14} className="text-[#f6d79e]" />
                    <span className="text-white">View My Reservations</span>
                  </button>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="px-6 py-3 rounded-full bg-[#fbf8f1] border border-[#20352b]/20 text-[#20352b] font-semibold text-xs hover:bg-[#efe7db] transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                  >
                    <PlusCircle size={14} className="text-[#9e6d27]" />
                    <span>Book Another Stay</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
                <div className="border-b border-[#20352b]/10 pb-4">
                  <h2 className="font-serif text-2xl font-bold text-[#20352b] flex items-center gap-2">
                    <CalendarDays size={22} className="text-[#c8a36a]" />
                    Book Your Stay at Casa Nest
                  </h2>
                  <p className="text-xs text-[#77766c] mt-1">
                    Choose your preferred room, dates, and number of guests. No advance payment required — pay directly at the homestay front desk.
                  </p>
                </div>

                <form onSubmit={submitBookingForm} className="space-y-5 text-xs">
                  {/* Room Selection */}
                  <div>
                    <label className="block font-semibold uppercase font-mono text-[10px] tracking-wider text-[#77766c] mb-1.5">
                      Select Room *
                    </label>
                    {roomsLoading ? (
                      <div className="p-4 text-center text-[#77766c]">Loading rooms...</div>
                    ) : rooms.length === 0 ? (
                      <div className="p-4 text-center text-[#77766c]">No rooms available at the moment.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rooms.map((room) => (
                          <div
                            key={room.id}
                            onClick={() => { setSelectedRoomId(room.id); setDatesConflict(false); }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              selectedRoomId === room.id
                                ? "bg-[#20352b] text-[#fbf8f1] border-[#20352b] shadow-md"
                                : "bg-white text-[#20352b] border-[#20352b]/15 hover:bg-[#f5f0e8]"
                            }`}
                          >
                            <div className="font-semibold text-sm">{room.name}</div>
                            <div className={`text-[11px] mt-0.5 ${
                              selectedRoomId === room.id ? "text-[#c8a36a]" : "text-[#77766c]"
                            }`}>
                              {room.room_type} • ₹{Number(room.price_per_night).toLocaleString("en-IN")}/night
                            </div>
                            <div className={`text-[10px] mt-1 ${
                              selectedRoomId === room.id ? "text-[#fbf8f1]/70" : "text-[#77766c]"
                            }`}>
                              {room.capacity} Guest{room.capacity > 1 ? "s" : ""} Max
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold uppercase font-mono text-[10px] tracking-wider text-[#77766c] mb-1.5">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={bookCheckIn}
                        onChange={(e) => { setBookCheckIn(e.target.value); setDatesConflict(false); }}
                        className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase font-mono text-[10px] tracking-wider text-[#77766c] mb-1.5">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={bookCheckIn || new Date().toISOString().split("T")[0]}
                        value={bookCheckOut}
                        onChange={(e) => { setBookCheckOut(e.target.value); setDatesConflict(false); }}
                        className="w-full bg-white border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                      />
                    </div>
                  </div>

                  {/* Date conflict warning */}
                  {datesConflict && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <strong>Selected dates are unavailable!</strong>
                        <p className="mt-0.5 text-[11px] text-red-600/90">
                          This room has an active booking during these dates. Please choose different dates or select another room.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Guests */}
                  <div>
                    <label className="block font-semibold uppercase font-mono text-[10px] tracking-wider text-[#77766c] mb-1.5">
                      Number of Guests *
                    </label>
                    <div className="flex items-center gap-3 bg-white border border-[#20352b]/15 rounded-xl px-4 py-2.5 w-fit">
                      <button
                        type="button"
                        onClick={() => setBookGuests((v) => Math.max(1, v - 1))}
                        className="w-7 h-7 rounded-full bg-[#f5f0e8] text-[#20352b] flex items-center justify-center hover:bg-[#efe7db] transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold text-[#20352b] min-w-[60px] text-center">
                        {bookGuests} {bookGuests === 1 ? "Guest" : "Guests"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBookGuests((v) => Math.min(6, v + 1))}
                        className="w-7 h-7 rounded-full bg-[#f5f0e8] text-[#20352b] flex items-center justify-center hover:bg-[#efe7db] transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Guest Info (Auto-filled) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold uppercase font-mono text-[10px] tracking-wider text-[#77766c] mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || ""}
                        disabled
                        className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#77766c] cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase font-mono text-[10px] tracking-wider text-[#77766c] mb-1.5">
                        Your Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#77766c] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Price Preview */}
                  {selectedRoomId > 0 && bookCheckIn && bookCheckOut && !datesConflict && (
                    (() => {
                      const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
                      const nights = Math.max(1, Math.ceil(
                        (new Date(bookCheckOut).getTime() - new Date(bookCheckIn).getTime()) / (1000 * 60 * 60 * 24)
                      ));
                      const pricePerNight = Number(selectedRoom?.price_per_night || 0);
                      const total = pricePerNight * nights;
                      return (
                        <div className="p-4 rounded-2xl bg-[#20352b] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-[#20352b]">
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-[#f6d79e] font-semibold">
                              Estimated Stay Cost
                            </div>
                            <div className="text-xl font-serif font-bold text-white">
                              ₹{total.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[11px] text-white/80">
                              {selectedRoom?.name} • {nights} Night{nights > 1 ? "s" : ""} × ₹{pricePerNight.toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-white/90 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                            <ShieldCheck size={14} className="text-[#f6d79e]" />
                            <span>No advance • Pay at front desk</span>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={bookingSubmitting || datesConflict || rooms.length === 0}
                    className="w-full py-3 rounded-full bg-[#c8a36a] text-[#20352b] font-semibold text-sm hover:bg-[#b9945b] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {bookingSubmitting ? (
                      <><RefreshCw size={14} className="animate-spin" /> Submitting...</>
                    ) : datesConflict ? (
                      <>Dates Unavailable — Pick Other Dates</>
                    ) : (
                      <>Check Availability & Book <ArrowRight size={15} /></>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-[#77766c] flex items-center justify-center gap-1">
                    <Check size={12} />
                    No advance online payment required • Pay directly at homestay front desk (Cash / UPI)
                  </p>
                </form>
              </div>
            )}
          </div>
        )}



        {/* TAB 2: MY PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-6 sm:p-10 shadow-xs max-w-2xl mx-auto space-y-6">
            <div className="border-b border-[#20352b]/10 pb-4">
              <h2 className="font-serif text-2xl font-bold text-[#20352b]">My Guest Profile</h2>
              <p className="text-xs text-[#77766c] mt-1">
                Manage your contact details and security preferences for Casa Nest reservations.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase font-mono text-[#20352b] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono text-[#20352b] mb-1">
                  Email Address (Login ID)
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-[#f5f0e8]/30 border border-[#20352b]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#77766c] cursor-not-allowed"
                />
                <span className="text-[10px] text-[#77766c] block mt-1">
                  Email address cannot be changed as it is tied to your reservations.
                </span>
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono text-[#20352b] mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div className="pt-4 border-t border-[#20352b]/10 space-y-3">
                <span className="font-semibold text-sm text-[#20352b] block">Change Password (Optional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#77766c] mb-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-xl px-3.5 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#77766c] mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#f5f0e8]/60 border border-[#20352b]/15 rounded-xl px-3.5 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#20352b]/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Log Out of Account</span>
                </button>
                <button
                  type="submit"
                  disabled={profileUpdating}
                  className="px-6 py-2.5 rounded-full bg-[#20352b] text-[#fbf8f1] font-semibold text-xs hover:bg-[#2c473a] transition-all cursor-pointer disabled:opacity-50"
                >
                  {profileUpdating ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: HOST HELPLINE & GUIDELINES */}
        {activeTab === "support" && (
          <div className="bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-6 sm:p-10 shadow-xs max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#20352b]">Host Assistance & Concierge</h2>
              <p className="text-xs text-[#77766c] mt-1">
                Our front desk hosts are here to assist with check-in, ghat tours, boat rides, and comfortable stays.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <a
                href="https://wa.me/918400095434"
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 hover:border-[#20352b]/30 transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#20352b]">WhatsApp Concierge</h4>
                  <p className="text-[#77766c] mt-0.5">Instant chat for boat arrangements, directions and recommendations.</p>
                  <span className="inline-block font-mono text-[11px] text-emerald-800 font-semibold mt-2">
                    Open WhatsApp Chat →
                  </span>
                </div>
              </a>

              <a
                href="tel:+918400095434"
                className="p-5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 hover:border-[#20352b]/30 transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#20352b]/10 text-[#20352b] flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#20352b]">Direct Phone Line</h4>
                  <p className="text-[#77766c] mt-0.5">24/7 Front desk support (+91 84000 95434, +91 93369 41261).</p>
                  <span className="inline-block font-mono text-[11px] text-[#20352b] font-semibold mt-2">
                    Call Reception Desk →
                  </span>
                </div>
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-[#f5f0e8]/80 border border-[#20352b]/10 space-y-3 text-xs">
              <h4 className="font-bold text-sm text-[#20352b] flex items-center gap-1.5">
                <Clock size={16} className="text-[#c8a36a]" /> Check-In & Stay Timings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#77766c]">
                <div>
                  <strong className="text-[#20352b] block">Check-In: 12:00 PM Onwards</strong>
                  <span>Early check-in can be accommodated depending on room availability on arrival.</span>
                </div>
                <div>
                  <strong className="text-[#20352b] block">Check-Out: By 11:00 AM</strong>
                  <span>Luggage storage is available complimentary if your train or flight is later in the day.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invoice & Voucher Printable Modal */}
      <BookingInvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={Boolean(selectedInvoiceBooking)}
        onClose={() => setSelectedInvoiceBooking(null)}
      />



      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        defaultName={user?.name}
        defaultEmail={user?.email}
      />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BedDouble,
  CalendarDays,
  IndianRupee,
  LogIn,
  LogOut,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Mail,
  Percent,
  SlidersHorizontal,
  Sparkles,
  Clock,
  CheckCircle2,
  RefreshCw,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Receipt,
  Eye,
  Check,
  ArrowRight,
  Lock,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import { fetchDashboardData, DashboardData } from "@/api/admin";
import { getContactMessages, ContactMessage } from "@/api/contact";
import { fetchRooms, updateRoom, Room } from "@/api/rooms";
import { getBookings, Booking } from "@/api/bookings";
import { toast } from "sonner";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | "vacant" | "occupied">("all");
  const [activeStatModal, setActiveStatModal] = useState<
    | "total_rooms"
    | "today_bookings"
    | "today_checkins"
    | "today_checkouts"
    | "live_occupancy"
    | "today_revenue"
    | "total_revenue"
    | "pending_requests"
    | null
  >(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [res, msgs, roomsData, bookingsData] = await Promise.all([
        fetchDashboardData(),
        getContactMessages().catch(() => []),
        fetchRooms().catch(() => []),
        getBookings().catch(() => []),
      ]);
      setData(res);
      setMessages(msgs);
      const sortedRooms = [...roomsData].sort((a, b) => {
        const numA = parseInt((a.name.match(/\d+/) || ["999"])[0], 10);
        const numB = parseInt((b.name.match(/\d+/) || ["999"])[0], 10);
        return numA - numB;
      });
      setRooms(sortedRooms);
      setAllBookings(bookingsData);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      toast.error("Failed to refresh dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {
    totalRooms: 3,
    availableRooms: 3,
    todayBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    todayOrders: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    monthCustomers: 0,
    todayBookingRevenue: 0,
    todayOrderRevenue: 0,
    totalBookingRevenue: 0,
    totalOrderRevenue: 0,
    totalRevenue: 0,
    pendingRequests: 0,
  };

  const occupiedRoomsCount = rooms.filter((r) => r.occupancy?.is_occupied).length;
  const vacantRoomsCount = Math.max(0, rooms.length - occupiedRoomsCount);
  const liveOccupancyRate = rooms.length > 0 ? Math.round((occupiedRoomsCount / rooms.length) * 100) : 0;

  const todayYMD = new Date().toISOString().split("T")[0];

  const todayBookingsList = allBookings.filter((b) => {
    if (!b.created_at) return false;
    const bDate = b.created_at.split("T")[0];
    return bDate === todayYMD;
  });

  const todayCheckInsList = allBookings.filter((b) => {
    if (!b.check_in) return false;
    const inDate = b.check_in.split("T")[0];
    return inDate === todayYMD && b.status !== "cancelled";
  });

  const todayCheckOutsList = allBookings.filter((b) => {
    if (!b.check_out) return false;
    const outDate = b.check_out.split("T")[0];
    return outDate === todayYMD && b.status !== "cancelled";
  });

  const pendingBookingsList = allBookings.filter((b) => b.status === "pending");
  const unreadMessagesList = messages.filter((m) => m.status === "unread");
  const pendingRequestsTotal = pendingBookingsList.length + unreadMessagesList.length;

  const paidBookingsList = allBookings.filter((b) => b.payment_status === "paid" && b.status !== "cancelled");
  const totalPaidRevenue = paidBookingsList.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
  const avgBookingValue = paidBookingsList.length > 0 ? Math.round(totalPaidRevenue / paidBookingsList.length) : 0;

  const filteredRooms = rooms.filter((r) => {
    if (occupancyFilter === "vacant") return !r.occupancy?.is_occupied;
    if (occupancyFilter === "occupied") return r.occupancy?.is_occupied;
    return true;
  });

  return (
    <AdminLayout
      title="Homestay Management Overview"
      subtitle="Welcome back, Administrator. Live occupancy & reservations snapshot for Casa Nest."
      actions={
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="px-4 py-2 rounded-full bg-white hover:bg-[#efe7db] border border-[#20352b]/15 text-[#1a2f23] text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-all"
          title="Refresh live homestay metrics"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#9e6d27]" : "text-[#9e6d27]"} />
          <span>Refresh Data</span>
        </button>
      }
    >
      <div className="space-y-8">
        {/* Top 8 Metric Summary Cards (Clickable for full working details) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Rooms"
            value={rooms.length || stats.totalRooms}
            icon={BedDouble}
            subtitle={`${vacantRoomsCount} vacant / available`}
            onClick={() => setActiveStatModal("total_rooms")}
          />
          <StatCard
            title="Today's Bookings"
            value={todayBookingsList.length || stats.todayBookings}
            icon={CalendarDays}
            subtitle="New reservations today"
            onClick={() => setActiveStatModal("today_bookings")}
          />
          <StatCard
            title="Today's Check-ins"
            value={todayCheckInsList.length || stats.todayCheckIns}
            icon={LogIn}
            subtitle="Arrivals (from 12:00 PM)"
            onClick={() => setActiveStatModal("today_checkins")}
          />
          <StatCard
            title="Today's Check-outs"
            value={todayCheckOutsList.length || stats.todayCheckOuts}
            icon={LogOut}
            subtitle="Departures (by 11:00 AM)"
            onClick={() => setActiveStatModal("today_checkouts")}
          />
          <StatCard
            title="Live Occupancy"
            value={`${liveOccupancyRate}%`}
            icon={Percent}
            subtitle={`${occupiedRoomsCount} occupied • ${vacantRoomsCount} vacant`}
            onClick={() => setActiveStatModal("live_occupancy")}
          />
          <StatCard
            title="Today's Stay Revenue"
            value={`₹${(stats.todayBookingRevenue || stats.todayRevenue).toLocaleString()}`}
            icon={IndianRupee}
            subtitle="Room bookings today"
            highlight={true}
            onClick={() => setActiveStatModal("today_revenue")}
          />
          <StatCard
            title="This Week's Revenue"
            value={`₹${stats.weekRevenue.toLocaleString()}`}
            icon={IndianRupee}
            subtitle="Room bookings this week"
            onClick={() => setActiveStatModal("total_revenue")}
          />
          <StatCard
            title="This Month's Revenue"
            value={`₹${stats.monthRevenue.toLocaleString()}`}
            icon={TrendingUp}
            subtitle="Room bookings this month"
            onClick={() => setActiveStatModal("total_revenue")}
          />
          <StatCard
            title="Total Room Revenue"
            value={`₹${(totalPaidRevenue || stats.totalBookingRevenue || stats.totalRevenue).toLocaleString()}`}
            icon={TrendingUp}
            subtitle="Lifetime reservations revenue"
            onClick={() => setActiveStatModal("total_revenue")}
          />
          <StatCard
            title="Monthly Customers"
            value={stats.monthCustomers}
            icon={User}
            subtitle="Unique guests this month"
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequestsTotal || stats.pendingRequests}
            icon={AlertCircle}
            subtitle="Enquiries awaiting review"
            onClick={() => setActiveStatModal("pending_requests")}
          />
        </div>

        {/* Live Room Occupancy & Free Date Tracker */}
        <div className="bg-white border border-[#20352b]/15 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xl font-serif text-[#1a2f23] font-bold">
                  Live Room Occupancy & Free Date Tracker
                </h2>
              </div>
              <p className="text-xs text-[#50574d] mt-1">
                Real-time status of which rooms are <strong className="text-[#1a2f23]">Vacant (Khali)</strong> or <strong className="text-[#1a2f23]">Occupied (Booked)</strong>, with exact checkout and free-up dates.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f5f0e8] rounded-xl border border-[#20352b]/12 self-start sm:self-auto text-xs">
              <button
                onClick={() => setOccupancyFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  occupancyFilter === "all"
                    ? "bg-[#20352b] text-white shadow-2xs"
                    : "text-[#50574d] hover:text-[#1a2f23]"
                }`}
              >
                All Rooms ({rooms.length})
              </button>
              <button
                onClick={() => setOccupancyFilter("vacant")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  occupancyFilter === "vacant"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "text-emerald-800 hover:bg-emerald-100/60"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Vacant / Free ({vacantRoomsCount})
              </button>
              <button
                onClick={() => setOccupancyFilter("occupied")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  occupancyFilter === "occupied"
                    ? "bg-red-700 text-white shadow-2xs"
                    : "text-red-800 hover:bg-red-100/60"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Occupied ({occupiedRoomsCount})
              </button>
            </div>
          </div>

          {/* Room Occupancy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const occ = room.occupancy;
              const isOccupied = occ?.is_occupied;

              return (
                <div
                  key={room.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    isOccupied
                      ? "bg-red-50/40 border-red-200/80 shadow-xs"
                      : "bg-[#f5f0e8]/60 border-[#20352b]/10 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={room.image || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=88"}
                        alt={room.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#20352b]/10 shrink-0"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-[#20352b]">{room.name}</h4>
                        <span className="text-[11px] text-[#77766c] block">
                          {room.room_type || "Deluxe Suite"} • ₹{Number(room.price_per_night).toLocaleString()}/nt
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        isOccupied
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOccupied ? "bg-red-600 animate-pulse" : "bg-emerald-600"
                        }`}
                      />
                      {isOccupied ? "OCCUPIED" : "VACANT"}
                    </span>
                  </div>

                  {/* Occupancy Timeline / Free Date Info */}
                  <div className="p-3 rounded-xl bg-white/90 border border-[#20352b]/8 text-xs space-y-1.5">
                    {isOccupied ? (
                      <>
                        <div className="flex items-center justify-between text-[#20352b]">
                          <span className="text-[#77766c] font-medium flex items-center gap-1">
                            <Clock size={12} className="text-red-600" />
                            Free Hoga (Check-out Date):
                          </span>
                          <strong className="text-red-700 font-mono">
                            {occ?.free_on_date} (by {occ?.free_on_time})
                          </strong>
                        </div>

                        {occ?.days_until_free !== undefined && (
                          <div className="flex items-center justify-between text-[11px] text-[#77766c]">
                            <span>Availability timeline:</span>
                            <span className="font-medium text-red-600">
                              Free in {occ.days_until_free} day{occ.days_until_free > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}

                        {occ?.current_booking && (
                          <div className="pt-1.5 border-t border-[#20352b]/6 text-[11px] text-[#77766c]">
                            <p className="truncate">
                              Guest: <strong className="text-[#20352b]">{occ.current_booking.guest_name}</strong>
                              {occ.current_booking.guest_phone && ` • ${occ.current_booking.guest_phone}`}
                            </p>
                            <p className="font-mono text-[10px] text-[#77766c]/80">
                              Booking #CN-{String(occ.current_booking.id).padStart(5, "0")} • {occ.current_booking.payment_status.toUpperCase()}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-[#20352b]">
                          <span className="text-[#77766c] font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            Availability:
                          </span>
                          <strong className="text-emerald-700">Available Now</strong>
                        </div>

                        <div className="pt-1 text-[11px] text-[#77766c]">
                          {occ?.next_booking ? (
                            <p>
                              Next booked from: <strong className="text-[#20352b]">{occ.next_booking.check_in}</strong>
                              <span className="text-[10px] text-[#77766c] block">
                                (Free for next {occ.next_booking.days_until_checkin} day{occ.next_booking.days_until_checkin > 1 ? "s" : ""})
                              </span>
                            </p>
                          ) : (
                            <p className="text-emerald-700/90 font-medium">
                              No upcoming bookings. Room is completely open for guests.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Homestay Room Rates & Quick Pricing Authority */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-serif text-[#20352b] flex items-center gap-2">
                <Sparkles size={18} className="text-[#c8a36a]" />
                Homestay Room Rates & Quick Pricing Authority
              </h2>
              <p className="text-xs text-[#77766c]">
                Live tariff across all Casa Nest rooms. Increase or decrease rates with instant database save.
              </p>
            </div>
            <Link
              href="/admin/rooms"
              className="button button-dark px-3.5 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <SlidersHorizontal size={13} />
              <span>Full Room & Surge Manager</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-3.5 rounded-2xl bg-[#f5f0e8]/70 border border-[#20352b]/10 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={room.image || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=88"}
                    alt={room.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#20352b]/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-[#20352b] truncate">{room.name}</h4>
                    <span className="text-[11px] text-[#77766c] block truncate">
                      {room.room_type || "Deluxe Suite"} • Max {room.capacity}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#20352b]/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                      Price / Night
                    </span>
                    <span className="font-mono font-bold text-base text-[#20352b]">
                      ₹{Number(room.price_per_night).toLocaleString()}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#20352b]/10 text-[#20352b] font-medium border border-[#20352b]/10">
                    <Lock size={10} className="text-[#c8a36a]" /> Fixed Rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-serif text-[#20352b]">Room Booking Pipeline</h2>
              <p className="text-xs text-[#77766c]">Current status distribution of guest stays</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-[#20352b] hover:text-[#c8a36a] inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage all bookings</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#f5f0e8] p-4 rounded-2xl border border-[#20352b]/8">
              <span className="text-[10px] uppercase font-mono text-[#7d4e12] font-semibold block mb-1">
                Pending
              </span>
              <span className="text-2xl font-serif font-bold text-[#20352b]">
                {data?.bookingStatusMap?.pending || 0}
              </span>
            </div>
            <div className="bg-[#f5f0e8] p-4 rounded-2xl border border-[#20352b]/8">
              <span className="text-[10px] uppercase font-mono text-[#2c4e25] font-semibold block mb-1">
                Confirmed
              </span>
              <span className="text-2xl font-serif font-bold text-[#20352b]">
                {data?.bookingStatusMap?.confirmed || 0}
              </span>
            </div>
            <div className="bg-[#f5f0e8] p-4 rounded-2xl border border-[#20352b]/8">
              <span className="text-[10px] uppercase font-mono text-[#1c4870] font-semibold block mb-1">
                Completed
              </span>
              <span className="text-2xl font-serif font-bold text-[#20352b]">
                {data?.bookingStatusMap?.completed || 0}
              </span>
            </div>
            <div className="bg-[#f5f0e8] p-4 rounded-2xl border border-[#20352b]/8">
              <span className="text-[10px] uppercase font-mono text-[#8c2525] font-semibold block mb-1">
                Cancelled
              </span>
              <span className="text-2xl font-serif font-bold text-[#20352b]">
                {data?.bookingStatusMap?.cancelled || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Tables: Recent Bookings & Recent Guest Inquiries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#20352b]/10 mb-4">
                <div>
                  <h3 className="text-lg font-serif text-[#20352b]">Recent Reservations</h3>
                  <p className="text-xs text-[#77766c]">Latest room reservation requests</p>
                </div>
                <Link
                  href="/admin/bookings"
                  className="text-xs font-semibold text-[#20352b] hover:text-[#c8a36a] inline-flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-[#77766c]">Loading bookings...</div>
              ) : !data?.recentBookings || data.recentBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#77766c]">No recent bookings recorded.</div>
              ) : (
                <div className="space-y-3">
                  {data.recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[#f5f0e8]/50 border border-[#20352b]/8 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#20352b] truncate">{b.guest_name}</p>
                        <p className="text-[11px] text-[#77766c] truncate">
                          {b.room_name || "Assigned Room"} • {b.check_in ? new Date(b.check_in).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="font-mono font-semibold text-[#20352b]">
                          ₹{Number(b.total_amount).toLocaleString()}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#20352b]/8 text-center">
              <Link href="/admin/bookings" className="text-xs text-[#77766c] hover:text-[#20352b]">
                Manage reservation statuses →
              </Link>
            </div>
          </div>

          {/* Recent Guest Inquiries & Messages */}
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#20352b]/10 mb-4">
                <div>
                  <h3 className="text-lg font-serif text-[#20352b]">Recent Guest Inquiries</h3>
                  <p className="text-xs text-[#77766c]">Direct contact & inquiry messages</p>
                </div>
                <Link
                  href="/admin/messages"
                  className="text-xs font-semibold text-[#20352b] hover:text-[#c8a36a] inline-flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-[#77766c]">Loading inquiries...</div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#77766c]">No new inquiries received.</div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-[#f5f0e8]/50 border border-[#20352b]/8 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#20352b]">{m.name}</span>
                          <span className="text-[11px] text-[#77766c] truncate">({m.email})</span>
                        </div>
                        <p className="text-[11px] text-[#77766c] truncate mt-0.5">
                          {m.subject ? `${m.subject}: ` : ""}{m.message}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[10px] text-[#77766c] font-mono">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === "unread" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#20352b]/8 text-center">
              <Link href="/admin/messages" className="text-xs text-[#77766c] hover:text-[#20352b]">
                Open inquiries & messages →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Popups for all 8 Stat Cards */}
      <Modal
        isOpen={Boolean(activeStatModal)}
        onClose={() => setActiveStatModal(null)}
        title={
          activeStatModal === "total_rooms"
            ? `All Homestay Rooms & Rates (${rooms.length} Rooms)`
            : activeStatModal === "today_bookings"
            ? `Today's Reservations (${todayBookingsList.length})`
            : activeStatModal === "today_checkins"
            ? `Today's Scheduled Check-Ins (${todayCheckInsList.length})`
            : activeStatModal === "today_checkouts"
            ? `Today's Scheduled Check-Outs (${todayCheckOutsList.length})`
            : activeStatModal === "live_occupancy"
            ? `Live Homestay Occupancy (${liveOccupancyRate}%)`
            : activeStatModal === "today_revenue"
            ? `Today's Stay Revenue (₹${(stats.todayBookingRevenue || stats.todayRevenue).toLocaleString()})`
            : activeStatModal === "total_revenue"
            ? `Total Homestay Revenue (₹${(totalPaidRevenue || stats.totalBookingRevenue || stats.totalRevenue).toLocaleString()})`
            : activeStatModal === "pending_requests"
            ? `Pending Requests & Enquiries (${pendingRequestsTotal})`
            : "Metric Details"
        }
        subtitle={
          activeStatModal === "total_rooms"
            ? "Live room inventory, standard pricing, guest capacities, and real-time status"
            : activeStatModal === "today_bookings"
            ? `Reservations created today on ${todayYMD}`
            : activeStatModal === "today_checkins"
            ? `Guest arrivals scheduled for today (${todayYMD}). Standard check-in from 12:00 PM.`
            : activeStatModal === "today_checkouts"
            ? `Guest departures scheduled for today (${todayYMD}). Standard check-out by 11:00 AM.`
            : activeStatModal === "live_occupancy"
            ? `Real-time occupancy status: ${occupiedRoomsCount} occupied, ${vacantRoomsCount} vacant`
            : activeStatModal === "today_revenue"
            ? `Revenue collected from paid homestay bookings today (${todayYMD})`
            : activeStatModal === "total_revenue"
            ? "Cumulative earnings across all completed and confirmed reservations"
            : activeStatModal === "pending_requests"
            ? "Bookings awaiting confirmation and unread website customer enquiries"
            : undefined
        }
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* 1. TOTAL ROOMS POPUP */}
          {activeStatModal === "total_rooms" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
                  <span className="text-[10px] text-[#77766c] uppercase font-mono block">Total Rooms</span>
                  <strong className="text-sm font-serif text-[#20352b]">{rooms.length} Rooms</strong>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 uppercase font-mono block">Vacant Now</span>
                  <strong className="text-sm font-mono text-emerald-800">{vacantRoomsCount} Available</strong>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                  <span className="text-[10px] text-red-800 uppercase font-mono block">Occupied</span>
                  <strong className="text-sm font-mono text-red-800">{occupiedRoomsCount} In Stay</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
                  <span className="text-[10px] text-[#77766c] uppercase font-mono block">Standard Check-In</span>
                  <strong className="text-sm font-serif text-[#20352b]">From 12:00 PM</strong>
                </div>
              </div>

              <div className="divide-y divide-[#20352b]/8 max-h-[380px] overflow-y-auto pr-1 space-y-2.5">
                {rooms.map((room) => {
                  const isOcc = room.occupancy?.is_occupied;
                  return (
                    <div
                      key={room.id}
                      className="pt-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={room.image || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=88"}
                          alt={room.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#20352b]/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-[#20352b] truncate">{room.name}</h4>
                          <span className="text-[11px] text-[#77766c] block truncate">
                            {room.room_type || "Deluxe Suite"} • Max {room.capacity} Guests
                          </span>
                          <span className="text-[11px] font-mono text-[#c8a36a] font-medium">
                            ₹{Number(room.price_per_night).toLocaleString()} / night
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isOcc
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isOcc ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`} />
                          {isOcc ? "OCCUPIED" : "VACANT"}
                        </span>
                        <span className="text-[10px] text-[#77766c] block">
                          {isOcc ? `Free: ${room.occupancy?.free_on_date}` : "Ready for Guests"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Rates can be adjusted anytime from the Rooms Manager.</span>
                <Link
                  href="/admin/rooms"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-3.5 py-1.5 text-xs flex items-center gap-1"
                >
                  <span>Open Rooms Manager</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* 2. TODAY'S BOOKINGS POPUP */}
          {activeStatModal === "today_bookings" && (
            <div className="space-y-4">
              {todayBookingsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CalendarDays size={36} className="mx-auto text-[#c8a36a]" />
                  <h4 className="font-serif text-sm font-semibold text-[#20352b]">No New Bookings Created Today</h4>
                  <p className="text-xs text-[#77766c] max-w-sm mx-auto">
                    No reservations were booked on {todayYMD} yet. You can inspect all active and upcoming reservations in the Bookings tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {todayBookingsList.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[#f5f0e8]/60 border border-[#20352b]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#c8a36a]">
                            #CN-{String(b.id).padStart(5, "0")}
                          </span>
                          <span className="font-semibold text-[#20352b]">{b.guest_name}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-[11px] text-[#77766c] mt-0.5">
                          Room: <strong>{b.room_name || "Homestay Suite"}</strong> • {b.guests} Guests
                        </p>
                        <p className="text-[11px] text-[#77766c]">
                          Dates: {b.check_in?.split("T")[0]} to {b.check_out?.split("T")[0]}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm text-[#20352b] block">
                          ₹{Number(b.total_amount).toLocaleString("en-IN")}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase ${
                          b.payment_status === "paid" ? "text-emerald-700" : "text-amber-800"
                        }`}>
                          Payment: {b.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Total today: {todayBookingsList.length} reservation(s)</span>
                <Link
                  href="/admin/bookings"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-3.5 py-1.5 text-xs flex items-center gap-1"
                >
                  <span>Go to Bookings Portal</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* 3. TODAY'S CHECK-INS POPUP */}
          {activeStatModal === "today_checkins" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#efe7db] border border-[#20352b]/10 flex items-center gap-2.5 text-[11px] text-[#20352b]">
                <Clock size={16} className="text-[#c8a36a] shrink-0" />
                <span>
                  <strong>Standard Check-in Time:</strong> 12:00 PM onwards. Verify photo ID (Aadhaar/Passport) and hand over room key.
                </span>
              </div>

              {todayCheckInsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <LogIn size={36} className="mx-auto text-[#c8a36a]" />
                  <h4 className="font-serif text-sm font-semibold text-[#20352b]">No Check-Ins Scheduled for Today</h4>
                  <p className="text-xs text-[#77766c] max-w-sm mx-auto">
                    There are no new guest arrivals expected on {todayYMD}. You can view upcoming arrivals in the Bookings section.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {todayCheckInsList.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#20352b]">{b.guest_name}</span>
                          <span className="font-mono text-[11px] text-[#77766c]">
                            #CN-{String(b.id).padStart(5, "0")}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#77766c] mt-0.5">
                          Room: <strong className="text-[#20352b]">{b.room_name}</strong> • {b.guests} Guests
                        </p>
                        {b.guest_phone && (
                          <p className="text-[11px] text-[#77766c] flex items-center gap-1">
                            <Phone size={11} /> {b.guest_phone}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm text-[#20352b] block">
                          ₹{Number(b.total_amount).toLocaleString("en-IN")}
                        </span>
                        <StatusBadge status={b.payment_status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Total arrivals today: {todayCheckInsList.length}</span>
                <Link
                  href="/admin/bookings"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-3.5 py-1.5 text-xs"
                >
                  Manage Check-Ins
                </Link>
              </div>
            </div>
          )}

          {/* 4. TODAY'S CHECK-OUTS POPUP */}
          {activeStatModal === "today_checkouts" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#efe7db] border border-[#20352b]/10 flex items-center gap-2.5 text-[11px] text-[#20352b]">
                <Clock size={16} className="text-red-600 shrink-0" />
                <span>
                  <strong>Standard Check-out Time:</strong> Until 11:00 AM. Ensure key handover, room inspection, and invoice settlement.
                </span>
              </div>

              {todayCheckOutsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <LogOut size={36} className="mx-auto text-[#c8a36a]" />
                  <h4 className="font-serif text-sm font-semibold text-[#20352b]">No Departures Scheduled for Today</h4>
                  <p className="text-xs text-[#77766c] max-w-sm mx-auto">
                    There are no guest check-outs on {todayYMD}. Current guests remain checked-in until their respective departure dates.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {todayCheckOutsList.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#20352b]">{b.guest_name}</span>
                          <span className="font-mono text-[11px] text-[#77766c]">
                            #CN-{String(b.id).padStart(5, "0")}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#77766c] mt-0.5">
                          Departing Room: <strong className="text-[#20352b]">{b.room_name}</strong>
                        </p>
                        <p className="text-[11px] text-[#77766c]">
                          Check-out Deadline: <strong>11:00 AM Today</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm text-[#20352b] block">
                          ₹{Number(b.total_amount).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-[#77766c]">Bill: {b.payment_status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Total departures today: {todayCheckOutsList.length}</span>
                <Link
                  href="/admin/bookings"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-3.5 py-1.5 text-xs"
                >
                  Manage Check-Outs & Bills
                </Link>
              </div>
            </div>
          )}

          {/* 5. LIVE OCCUPANCY POPUP */}
          {activeStatModal === "live_occupancy" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
                  <span className="text-[10px] text-[#77766c] uppercase font-mono block">Occupancy Rate</span>
                  <strong className="text-base font-serif text-[#20352b]">{liveOccupancyRate}%</strong>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                  <span className="text-[10px] text-red-800 uppercase font-mono block">Occupied</span>
                  <strong className="text-base font-mono text-red-800">{occupiedRoomsCount} Rooms</strong>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 uppercase font-mono block">Vacant</span>
                  <strong className="text-base font-mono text-emerald-800">{vacantRoomsCount} Rooms</strong>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const isOcc = room.occupancy?.is_occupied;
                  const occ = room.occupancy;
                  return (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-2xl border ${
                        isOcc ? "bg-red-50/40 border-red-200" : "bg-emerald-50/30 border-emerald-200/80"
                      } flex items-center justify-between gap-3`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isOcc ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`} />
                          <h4 className="font-semibold text-sm text-[#20352b]">{room.name}</h4>
                          <span className="text-[10px] text-[#77766c]">({room.room_type})</span>
                        </div>
                        {isOcc ? (
                          <div className="text-[11px] text-[#77766c] mt-1 space-y-0.5">
                            <p>
                              Guest: <strong className="text-[#20352b]">{occ?.current_booking?.guest_name}</strong>
                              {occ?.current_booking?.guest_phone && ` (${occ.current_booking.guest_phone})`}
                            </p>
                            <p className="text-red-700 font-medium">
                              Free Hoga: {occ?.free_on_date} by {occ?.free_on_time} (in {occ?.days_until_free} days)
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#77766c] mt-1">
                            <span className="text-emerald-700 font-medium block">Vacant & Ready for Booking</span>
                            {occ?.next_booking ? (
                              <span className="text-[10px]">Next stay: {occ.next_booking.check_in} (Free for {occ.next_booking.days_until_checkin}d)</span>
                            ) : (
                              <span className="text-[10px]">No upcoming bookings (Fully Free)</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-[#20352b] block">
                          ₹{Number(room.price_per_night).toLocaleString()}/nt
                        </span>
                        <span className={`text-[10px] font-semibold uppercase ${isOcc ? "text-red-700" : "text-emerald-700"}`}>
                          {isOcc ? "Occupied" : "Vacant"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Updated in real-time from active stay calendar.</span>
                <button
                  type="button"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-4 py-1.5 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* 6. TODAY'S REVENUE POPUP */}
          {activeStatModal === "today_revenue" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#20352b] text-[#fbf8f1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#c8a36a] uppercase font-mono tracking-wider block">
                    Today's Total Collection
                  </span>
                  <strong className="text-2xl font-serif">
                    ₹{(stats.todayBookingRevenue || stats.todayRevenue).toLocaleString("en-IN")}
                  </strong>
                </div>
                <IndianRupee size={28} className="text-[#c8a36a]" />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 space-y-2">
                <span className="text-[11px] font-semibold text-[#20352b] block">Payment Modes Overview:</span>
                <p className="text-[11px] text-[#77766c]">
                  Casa Nest supports instant UPI / QR Code, Net Banking, Debit/Credit Card, and Homestay Front Desk cash settlements.
                </p>
              </div>

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">All transactions have generated official tax slips.</span>
                <Link
                  href="/admin/payments"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-3.5 py-1.5 text-xs"
                >
                  Open Payments Log
                </Link>
              </div>
            </div>
          )}

          {/* 7. TOTAL REVENUE POPUP */}
          {activeStatModal === "total_revenue" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
                  <span className="text-[10px] text-[#77766c] uppercase font-mono block">Paid Bookings</span>
                  <strong className="text-base font-serif text-[#20352b]">{paidBookingsList.length} Stays</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#20352b] text-[#fbf8f1] text-center">
                  <span className="text-[10px] text-[#c8a36a] uppercase font-mono block">Total Revenue</span>
                  <strong className="text-base font-serif">
                    ₹{(totalPaidRevenue || stats.totalBookingRevenue || stats.totalRevenue).toLocaleString("en-IN")}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
                  <span className="text-[10px] text-[#77766c] uppercase font-mono block">Average Stay Value</span>
                  <strong className="text-base font-serif text-[#20352b]">₹{avgBookingValue.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f5f0e8]/50 border border-[#20352b]/10 text-xs text-[#77766c] space-y-1.5">
                <p className="font-semibold text-[#20352b]">Revenue Reconciliation:</p>
                <p>• Reflects all confirmed and completed reservations marked as PAID.</p>
                <p>• Online payments via UPI/Card and Front Desk Cash settlements are accounted for.</p>
                <p>• Downloadable tax vouchers are archived for every paid transaction.</p>
              </div>

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Comprehensive records available in Payments ledger.</span>
                <Link
                  href="/admin/payments"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-3.5 py-1.5 text-xs"
                >
                  View All Transactions
                </Link>
              </div>
            </div>
          )}

          {/* 8. PENDING REQUESTS POPUP */}
          {activeStatModal === "pending_requests" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-800 uppercase font-mono block">Pending Bookings</span>
                  <strong className="text-base font-mono text-amber-800">{pendingBookingsList.length} Awaiting</strong>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-[10px] text-blue-800 uppercase font-mono block">Unread Enquiries</span>
                  <strong className="text-base font-mono text-blue-800">{unreadMessagesList.length} Messages</strong>
                </div>
              </div>

              {/* Pending Bookings List */}
              <div className="space-y-2">
                <h5 className="font-semibold text-xs text-[#20352b] flex items-center justify-between">
                  <span>Pending Room Reservations:</span>
                  <Link href="/admin/bookings" onClick={() => setActiveStatModal(null)} className="text-[11px] text-[#c8a36a] hover:underline">
                    View in Bookings →
                  </Link>
                </h5>
                {pendingBookingsList.length === 0 ? (
                  <p className="text-[11px] text-[#77766c] p-2.5 rounded-xl bg-[#f5f0e8]/50">No pending room reservations.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {pendingBookingsList.map((b) => (
                      <div key={b.id} className="p-2.5 rounded-xl bg-[#f5f0e8] border border-[#20352b]/10 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-[#20352b]">{b.guest_name}</strong>
                          <span className="text-[11px] text-[#77766c] block">{b.room_name} • {b.check_in?.split("T")[0]}</span>
                        </div>
                        <span className="font-mono font-bold text-[#20352b]">₹{Number(b.total_amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unread Messages List */}
              <div className="space-y-2 pt-2 border-t border-[#20352b]/10">
                <h5 className="font-semibold text-xs text-[#20352b] flex items-center justify-between">
                  <span>Website Contact Enquiries:</span>
                  <Link href="/admin/messages" onClick={() => setActiveStatModal(null)} className="text-[11px] text-[#c8a36a] hover:underline">
                    View in Messages →
                  </Link>
                </h5>
                {unreadMessagesList.length === 0 ? (
                  <p className="text-[11px] text-[#77766c] p-2.5 rounded-xl bg-[#f5f0e8]/50">No unread enquiries from the website.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {unreadMessagesList.map((m) => (
                      <div key={m.id} className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-200/60 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <strong className="text-[#20352b] block">{m.name} ({m.email})</strong>
                          <p className="text-[11px] text-[#77766c] truncate">{m.subject || m.message}</p>
                        </div>
                        <span className="text-[10px] text-[#77766c] font-mono shrink-0 ml-2">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#77766c]">Click on respective portals to review or reply.</span>
                <button
                  type="button"
                  onClick={() => setActiveStatModal(null)}
                  className="button button-dark px-4 py-1.5 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}

import { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  Clock,
  Coffee,
  Users,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import api from "@/api/axios";
import { fetchServices, RoomServiceRequest } from "@/api/services";

interface DashboardStats {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  todays_checkins: number;
  todays_checkouts: number;
  pending_bookings: number;
  unread_messages: number;
}

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  room_id: number | null;
  room_name?: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_amount: number;
  payment_status: string;
}

export default function ReceptionDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [recentServices, setRecentServices] = useState<RoomServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, bookingsRes, servicesRes] = await Promise.allSettled([
          api.get("/admin/dashboard"),
          api.get("/bookings?limit=6"),
          fetchServices({ status: "all" }),
        ]);

        if (statsRes.status === "fulfilled") {
          const d = statsRes.value.data.stats || statsRes.value.data;
          setStats({
            total_rooms: d.totalRooms || d.total_rooms || 3,
            available_rooms: d.availableRooms || d.available_rooms || 3,
            occupied_rooms: Math.max(0, (d.totalRooms || 3) - (d.availableRooms || 3)),
            todays_checkins: d.todayCheckIns || d.todays_checkins || 0,
            todays_checkouts: d.todayCheckOuts || d.todays_checkouts || 0,
            pending_bookings: d.pendingRequests || d.pending_bookings || 0,
            unread_messages: d.unread_messages || 0,
          });
        }
        if (bookingsRes.status === "fulfilled") {
          setTodayBookings(bookingsRes.value.data.bookings || bookingsRes.value.data || []);
        }
        if (servicesRes.status === "fulfilled") {
          setRecentServices(servicesRes.value.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statCards = [
    { label: "Available Suites", value: stats?.available_rooms ?? "–", icon: BedDouble, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    { label: "Today's Check-ins", value: stats?.todays_checkins ?? "–", icon: CalendarCheck, color: "bg-[#c8a36a]/15 text-[#a07840] border-[#c8a36a]/30" },
    { label: "Today's Check-outs", value: stats?.todays_checkouts ?? "–", icon: CalendarX, color: "bg-blue-50 text-blue-800 border-blue-200" },
    { label: "Pending Stays", value: stats?.pending_bookings ?? "–", icon: Clock, color: "bg-amber-50 text-amber-800 border-amber-200" },
    { label: "Room Service / Kettle", value: recentServices.filter(s => s.status !== "completed").length, icon: Coffee, color: "bg-purple-50 text-purple-800 border-purple-200" },
    { label: "Guest Inquiries", value: stats?.unread_messages ?? "0", icon: AlertCircle, color: "bg-rose-50 text-rose-800 border-rose-200" },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
    completed: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-800",
  };

  return (
    <ReceptionLayout
      title="Front Desk & Homestay Reception Hub"
      subtitle={`Welcome to Casa Nest Homestay. Front desk operations for ${today}`}
    >
      {/* Quick Action Navigation Buttons */}
      <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl p-5 mb-8 shadow-xs">
        <h2 className="font-serif text-sm font-semibold text-[#20352b] mb-3">Front Desk Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Link
            href="/reception/checkin"
            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-100"
          >
            <CalendarCheck size={20} />
            <span className="text-xs font-semibold">Check-In Guest</span>
          </Link>
          <Link
            href="/reception/bookings"
            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-[#c8a36a]/15 text-[#a07840] hover:bg-[#c8a36a]/25 transition-colors border border-[#c8a36a]/20"
          >
            <Users size={20} />
            <span className="text-xs font-semibold">Walk-in Booking</span>
          </Link>
          <Link
            href="/reception/services"
            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors border border-purple-100"
          >
            <Coffee size={20} />
            <span className="text-xs font-semibold">Kettle & Chai Sachets</span>
          </Link>
          <Link
            href="/reception/payments"
            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors border border-blue-100"
          >
            <CreditCard size={20} />
            <span className="text-xs font-semibold">Collect Stay Payment</span>
          </Link>
          <Link
            href="/reception/guests"
            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-[#20352b]/8 text-[#20352b] hover:bg-[#20352b]/15 transition-colors border border-[#20352b]/10"
          >
            <Users size={20} />
            <span className="text-xs font-semibold">Guest Directory</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-[#fbf8f1] border rounded-2xl p-4 flex flex-col gap-2 ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} />
                <span className="text-2xl font-serif font-bold">{loading ? "–" : card.value}</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider leading-tight opacity-80">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Recent Bookings & In-Room Service Requests */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Bookings */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#20352b]/8">
            <div>
              <h2 className="font-serif text-base text-[#20352b]">Recent Stay Reservations</h2>
              <p className="text-[11px] text-[#77766c]">Latest stays & check-in pipeline</p>
            </div>
            <Link
              href="/reception/bookings"
              className="text-[11px] text-[#c8a36a] hover:underline flex items-center gap-1 font-semibold"
            >
              Manage Stays <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#20352b]/6">
            {loading ? (
              <div className="px-5 py-8 text-center text-xs text-[#77766c]">Loading stays...</div>
            ) : todayBookings.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[#77766c]">No bookings found.</div>
            ) : (
              todayBookings.slice(0, 5).map((b) => (
                <div key={b.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[#f5f0e8]/40 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-[#20352b]">{b.guest_name}</p>
                    <p className="text-[11px] text-[#77766c]">
                      {b.room_name || "Suite"} • {new Date(b.check_in).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold ${
                        statusColor[b.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Room Service Requests (Chai, Coffee Sachets, Kettle Setup) */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#20352b]/8">
            <div>
              <h2 className="font-serif text-base text-[#20352b]">Room Services & Kettle Requests</h2>
              <p className="text-[11px] text-[#77766c]">Chai/coffee sachets, kettle & amenities</p>
            </div>
            <Link
              href="/reception/services"
              className="text-[11px] text-[#c8a36a] hover:underline flex items-center gap-1 font-semibold"
            >
              All Requests <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#20352b]/6">
            {loading ? (
              <div className="px-5 py-8 text-center text-xs text-[#77766c]">Loading services...</div>
            ) : recentServices.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[#77766c]">No active service requests.</div>
            ) : (
              recentServices.slice(0, 5).map((s) => (
                <div key={s.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[#f5f0e8]/40 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-[#20352b]">
                      📍 {s.room_number} • <span className="font-normal text-[#77766c]">{s.guest_name}</span>
                    </p>
                    <p className="text-[11px] text-[#20352b] font-medium mt-0.5">
                      {s.service_type} ({s.quantity}x)
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold ${
                      statusColor[s.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ReceptionLayout>
  );
}

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  IndianRupee,
  BedDouble,
  Sparkles,
  Download,
  Users,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchReportsData } from "@/api/admin";
import { toast } from "sonner";

export default function Reports() {
  const [period, setPeriod] = useState<string>("month");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchReportsData(period);
      setReportData(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate analytics report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success("Downloading CSV summary...");
    const content = "data:text/csv;charset=utf-8,Casa Nest Homestay Report\nDate,Bookings,Revenue\n" +
      (reportData?.bookingTrends || []).map((b: any) => `${b.date},${b.total_bookings},${b.revenue}`).join("\n");
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `casanest_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBookings = (reportData?.bookingTrends || []).reduce(
    (acc: number, curr: any) => acc + Number(curr.total_bookings),
    0
  );
  const totalRevenue = (reportData?.bookingTrends || []).reduce(
    (acc: number, curr: any) => acc + Number(curr.revenue),
    0
  );
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  return (
    <AdminLayout
      title="Homestay Reports & Financial Analytics"
      subtitle="Comprehensive reservation breakdowns, room occupancy and homestay revenue metrics"
      actions={
        <div className="flex items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="bg-[#fbf8f1] border border-[#20352b]/15 rounded-full p-1 flex items-center gap-1">
            {["today", "week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  period === p
                    ? "bg-[#20352b] text-[#fbf8f1]"
                    : "text-[#77766c] hover:text-[#20352b]"
                }`}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="button button-dark px-3.5 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8 text-xs">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/12 shadow-sm">
            <div className="flex items-center justify-between text-[#77766c] uppercase font-mono text-[10px] tracking-wider mb-2">
              <span>Total Reservations</span>
              <BedDouble size={16} className="text-[#20352b]" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-[#20352b]">
              {totalBookings} Stays
            </h3>
            <p className="text-[#77766c] mt-1">Confirmed guest stays in selected timeframe</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/12 shadow-sm">
            <div className="flex items-center justify-between text-[#77766c] uppercase font-mono text-[10px] tracking-wider mb-2">
              <span>Average Booking Value</span>
              <TrendingUp size={16} className="text-[#20352b]" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-[#20352b]">
              ₹{avgBookingValue.toLocaleString()}
            </h3>
            <p className="text-[#77766c] mt-1">Average revenue generated per reservation</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#20352b] text-white border border-[#20352b] shadow-sm">
            <div className="flex items-center justify-between text-[#f6d79e] uppercase font-mono text-[10px] font-semibold tracking-wider mb-2">
              <span>Homestay Stay Revenue</span>
              <IndianRupee size={16} className="text-[#f6d79e]" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-white">
              ₹{totalRevenue.toLocaleString()}
            </h3>
            <p className="text-white/80 mt-1">Total revenue from guest room stays</p>
          </div>
        </div>

        {/* Breakdown Tables & Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Popularity / Occupancy */}
          <div className="p-6 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/12 shadow-sm">
            <div className="pb-4 border-b border-[#20352b]/10 mb-4">
              <h3 className="text-lg font-serif text-[#20352b]">Room Occupancy & Earnings</h3>
              <p className="text-xs text-[#77766c]">Revenue breakdown per suite</p>
            </div>

            <div className="space-y-4">
              {(!reportData?.roomPopularity || reportData.roomPopularity.length === 0) ? (
                <p className="text-[#77766c] italic text-center py-6">No stay records available.</p>
              ) : (
                reportData.roomPopularity.map((room: any, i: number) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-[#20352b] text-sm">{room.name}</span>
                      <span className="font-mono text-[#20352b]">
                        ₹{Number(room.revenue).toLocaleString()} ({room.bookings_count} stays)
                      </span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2.5 bg-[#f5f0e8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#20352b] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max((Number(room.bookings_count) / 10) * 100, 15), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Booking Timeline */}
          <div className="p-6 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/12 shadow-sm">
            <div className="pb-4 border-b border-[#20352b]/10 mb-4">
              <h3 className="text-lg font-serif text-[#20352b]">Booking Activity Trends</h3>
              <p className="text-xs text-[#77766c]">Daily stay distribution and revenue timeline</p>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {(!reportData?.bookingTrends || reportData.bookingTrends.length === 0) ? (
                <p className="text-[#77766c] italic text-center py-6">No activity records in this period.</p>
              ) : (
                reportData.bookingTrends.map((trend: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-[#f5f0e8]/50 border border-[#20352b]/8 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#20352b]/10 text-[#20352b] text-xs font-mono font-bold flex items-center justify-center">
                        <Calendar size={13} />
                      </span>
                      <div>
                        <span className="font-semibold text-[#20352b] block">{trend.date}</span>
                        <span className="text-[10px] text-[#77766c]">{trend.total_bookings} reservation(s)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-[#20352b] block">
                        ₹{Number(trend.revenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

import api from "./axios";

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms?: number;
  occupancyRate?: number;
  todayBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  todayOrders: number;
  todayRevenue: number;
  todayBookingRevenue: number;
  todayOrderRevenue: number;
  totalBookingRevenue: number;
  totalOrderRevenue: number;
  totalRevenue: number;
  pendingRequests: number;
}

export interface RoomOccupancyItem {
  id: number;
  name: string;
  room_type: string | null;
  price_per_night: number;
  capacity: number;
  image: string | null;
  is_occupied: boolean;
  occupancy_status: "vacant" | "occupied";
  free_on_date: string | null;
  free_on_time: string;
  days_until_free: number;
  summary_label: string;
  current_booking?: {
    id: number;
    guest_name: string;
    guest_email: string;
    guest_phone: string | null;
    check_in: string;
    check_out: string;
    total_amount: number;
    payment_status: string;
  } | null;
  next_booking?: {
    id: number;
    guest_name: string;
    check_in: string;
    check_out: string;
    days_until_checkin: number;
  } | null;
}

export interface DashboardData {
  stats: DashboardStats;
  roomOccupancy?: RoomOccupancyItem[];
  bookingStatusMap: Record<string, number>;
  recentBookings: any[];
  recentOrders: any[];
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: number;
  link: string | null;
  created_at: string;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await api.get<{ success: boolean } & DashboardData>("/admin/dashboard");
  return {
    stats: response.data.stats,
    bookingStatusMap: response.data.bookingStatusMap,
    recentBookings: response.data.recentBookings,
    recentOrders: response.data.recentOrders,
  };
}

export async function fetchReportsData(period = "month") {
  const response = await api.get<{ success: boolean; [key: string]: any }>("/admin/reports", {
    params: { period },
  });
  return response.data;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await api.get<{ success: boolean; notifications: NotificationItem[] }>("/admin/notifications");
  return response.data.notifications;
}

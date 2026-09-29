import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  CreditCard,
  Image as ImageIcon,
  Star,
  Mail,
  Tag,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  PartyPopper,
  BookOpen,
  Coffee,
} from "lucide-react";
import { getCurrentUser, logout } from "@/api/auth";

const logoPath = "/logo.png";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Check-In / Out", href: "/admin/checkin", icon: UserCheck },
  { label: "Room Services & Kettle", href: "/admin/services", icon: Coffee },
  { label: "Patio Events", href: "/admin/patio", icon: PartyPopper },
  { label: "Library", href: "/admin/library", icon: BookOpen },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Offers & Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Messages", href: "/admin/messages", icon: Mail },
  { label: "Staff", href: "/admin/staff", icon: UserCheck },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = getCurrentUser() || { name: "Administrator", role: "admin", email: "admin@casanest.com" };

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#20352b] flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#20352b]/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#fbf8f1] border-r border-[#20352b]/12 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#20352b]/10 bg-[#f5f0e8]/40">
          <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <img
              src={logoPath}
              alt="Casa Nest"
              className="w-12 h-12 object-contain shrink-0 mix-blend-multiply scale-150"
            />
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-serif text-lg font-bold text-[#182a20] leading-none block">
                  Casa Nest
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#9e6d27] font-bold">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#50574d] hover:text-[#182a20] hover:bg-[#20352b]/8 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-[#50574d] hover:text-[#182a20] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/admin/dashboard" && location.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-[#20352b] text-white shadow-sm"
                    : "text-[#182a20] hover:text-[#0c1610] hover:bg-[#20352b]/8"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-[#f6d79e]" : "text-[#20352b]/80 group-hover:text-[#182a20]"
                  }`}
                />
                {!isCollapsed && (
                  <span className={`truncate font-semibold ${isActive ? "text-white" : "text-[#182a20]"}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Footer */}
        <div className="p-3.5 border-t border-[#20352b]/10 bg-[#f5f0e8]/30">
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-[#20352b]/12 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#20352b] text-[#f6d79e] flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1a2f23] truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-[#50574d] uppercase font-mono tracking-wider truncate font-medium">
                    {currentUser.role}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-[#50574d] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Header */}
        <header className="h-20 sticky top-0 z-30 bg-[#fbf8f1]/90 backdrop-blur-md border-b border-[#20352b]/10 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-[#20352b] hover:bg-[#20352b]/6 rounded-xl cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif text-[#1a2f23] font-bold leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#50574d] font-normal hidden sm:block truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            {actions}

            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1a2f23] bg-white hover:bg-[#efe7db] border border-[#20352b]/15 shadow-2xs transition-colors"
            >
              <span>View Website</span>
              <ExternalLink size={13} />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full text-[#20352b] hover:bg-[#20352b]/6 transition-colors relative"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c8a36a] rounded-full ring-2 ring-[#fbf8f1]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-[#20352b]/10 mb-3">
                    <span className="font-serif font-semibold text-sm">Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-[#77766c] hover:text-[#20352b]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#f5f0e8] text-[#20352b]">
                      <p className="font-semibold">System Online</p>
                      <p className="text-[11px] text-[#77766c]">Casa Nest live reservations active.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prominent Header Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
              title="Logout from Admin Portal"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Main Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Coffee,
  CreditCard,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  ExternalLink,
  UserCheck,
  Phone,
  BookOpen,
} from "lucide-react";
import { getCurrentUser, logout } from "@/api/auth";

const logoPath = "/logo.png";

interface ReceptionLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/reception/dashboard", icon: LayoutDashboard },
  { label: "Room Status", href: "/reception/rooms", icon: BedDouble },
  { label: "Bookings", href: "/reception/bookings", icon: CalendarDays },
  { label: "Check-In / Out", href: "/reception/checkin", icon: UserCheck },
  { label: "Homestay Library", href: "/reception/library", icon: BookOpen },
  { label: "Room Services & Kettle", href: "/reception/services", icon: Coffee },
  { label: "Payments & Billing", href: "/reception/payments", icon: CreditCard },
  { label: "Guest Directory", href: "/reception/guests", icon: Phone },
  { label: "Messages & Requests", href: "/reception/messages", icon: Mail },
];

export default function ReceptionLayout({
  children,
  title,
  subtitle,
  actions,
}: ReceptionLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = getCurrentUser() || { name: "Receptionist", role: "receptionist", email: "reception@casanest.com" };

  const handleLogout = () => {
    logout();
    setLocation("/reception/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#20352b] flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#20352b]/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "linear-gradient(180deg, #1a2e24 0%, #20352b 100%)" }}
      >
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/10">
          <Link href="/reception/dashboard" className="flex items-center gap-3 overflow-hidden">
            <img
              src={logoPath}
              alt="Casa Nest"
              className="w-10 h-10 object-contain shrink-0 mix-blend-screen"
            />
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-serif text-base font-medium text-white leading-none block">
                  Casa Nest
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-semibold">
                  Reception
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role Badge */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-[#c8a36a]/15 border border-[#c8a36a]/30">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#c8a36a] font-semibold">Logged in as</p>
            <p className="text-xs font-semibold text-white mt-0.5 truncate">{currentUser.name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/reception/dashboard" && location.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all group ${
                  isActive
                    ? "bg-[#c8a36a] text-[#20352b] shadow-sm font-semibold"
                    : "text-white/90 font-medium hover:text-white hover:bg-white/12"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-[#20352b]" : "text-white/75 group-hover:text-white"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider & Admin Link */}
        {!isCollapsed && (
          <div className="mx-3 mb-2">
            <div className="border-t border-white/10 pt-2">
              <Link
                href="/admin/login"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <ExternalLink size={13} />
                Admin Panel
              </Link>
            </div>
          </div>
        )}

        {/* User Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#c8a36a] text-[#20352b] flex items-center justify-center font-serif text-sm font-bold shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider truncate">
                    Receptionist
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
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
              className="lg:hidden p-2 text-[#20352b] hover:bg-[#20352b]/6 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif text-[#20352b] leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#77766c] hidden sm:block truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}

            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#20352b] bg-[#f5f0e8] hover:bg-[#efe7db] border border-[#20352b]/15 transition-colors"
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
                <div className="absolute right-0 mt-2 w-72 bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-[#20352b]/10 mb-3">
                    <span className="font-serif font-semibold text-sm">Notifications</span>
                    <span className="text-[10px] font-mono text-[#c8a36a] uppercase">Live</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#f5f0e8] border border-[#20352b]/8">
                      <p className="font-semibold text-[#20352b]">Reception Ready</p>
                      <p className="text-[11px] text-[#77766c]">Connected to Casa Nest database.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
              title="Logout from Reception Desk"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

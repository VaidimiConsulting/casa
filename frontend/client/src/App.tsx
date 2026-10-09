import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Home Page loaded directly
import Home from "./pages/Home";

// Lazy-loaded pages (Code-Splitting for Lightning Fast Initial Load)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin Pages & Guard
const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Rooms = lazy(() => import("./pages/admin/Rooms"));
const Bookings = lazy(() => import("./pages/admin/Bookings"));
const PatioEvents = lazy(() => import("./pages/admin/PatioEvents"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const Gallery = lazy(() => import("./pages/admin/Gallery"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const Messages = lazy(() => import("./pages/admin/Messages"));
const Coupons = lazy(() => import("./pages/admin/Coupons"));
const Staff = lazy(() => import("./pages/admin/Staff"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const CheckIn = lazy(() => import("./pages/admin/CheckIn"));
const Services = lazy(() => import("./pages/admin/Services"));
const Finance = lazy(() => import("./pages/admin/Finance"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#20352b]/20 border-t-[#20352b] rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Customer Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/user/dashboard" component={MyBookings} />
      <Route path="/user-panel" component={MyBookings} />

      {/* Admin Public Route */}
      <Route path="/admin/login" component={AdminLogin} />

      {/* Admin Protected Routes - Clean homestay administration (No restaurant, food, payments) */}
      <Route path="/admin">
        {() => (<AdminGuard><Dashboard /></AdminGuard>)}
      </Route>
      <Route path="/admin/dashboard">
        {() => (<AdminGuard><Dashboard /></AdminGuard>)}
      </Route>
      <Route path="/admin/rooms">
        {() => (<AdminGuard><Rooms /></AdminGuard>)}
      </Route>
      <Route path="/admin/bookings">
        {() => (<AdminGuard><Bookings /></AdminGuard>)}
      </Route>
      <Route path="/admin/patio">
        {() => (<AdminGuard><PatioEvents /></AdminGuard>)}
      </Route>
      <Route path="/admin/payments">
        {() => (<AdminGuard><Payments /></AdminGuard>)}
      </Route>
      <Route path="/admin/finance">
        {() => (<AdminGuard><Finance /></AdminGuard>)}
      </Route>
      <Route path="/admin/gallery">
        {() => (<AdminGuard><Gallery /></AdminGuard>)}
      </Route>
      <Route path="/admin/customers">
        {() => (<AdminGuard><Customers /></AdminGuard>)}
      </Route>
      <Route path="/admin/reviews">
        {() => (<AdminGuard><Reviews /></AdminGuard>)}
      </Route>
      <Route path="/admin/messages">
        {() => (<AdminGuard><Messages /></AdminGuard>)}
      </Route>
      <Route path="/admin/coupons">
        {() => (<AdminGuard><Coupons /></AdminGuard>)}
      </Route>
      <Route path="/admin/checkin">
        {() => (<AdminGuard><CheckIn /></AdminGuard>)}
      </Route>
      <Route path="/admin/services">
        {() => (<AdminGuard><Services /></AdminGuard>)}
      </Route>
      <Route path="/admin/staff">
        {() => (<AdminGuard><Staff /></AdminGuard>)}
      </Route>
      <Route path="/admin/reports">
        {() => (<AdminGuard><Reports /></AdminGuard>)}
      </Route>
      <Route path="/admin/settings">
        {() => (<AdminGuard><Settings /></AdminGuard>)}
      </Route>

      {/* Legacy / Reception aliases redirect to Admin */}
      <Route path="/reception/login" component={AdminLogin} />
      <Route path="/reception">
        {() => (<AdminGuard><Dashboard /></AdminGuard>)}
      </Route>
      <Route path="/reception/dashboard">
        {() => (<AdminGuard><Dashboard /></AdminGuard>)}
      </Route>
      <Route path="/reception/rooms">
        {() => (<AdminGuard><Rooms /></AdminGuard>)}
      </Route>
      <Route path="/reception/bookings">
        {() => (<AdminGuard><Bookings /></AdminGuard>)}
      </Route>
      <Route path="/reception/checkin">
        {() => (<AdminGuard><CheckIn /></AdminGuard>)}
      </Route>
      <Route path="/reception/services">
        {() => (<AdminGuard><Services /></AdminGuard>)}
      </Route>

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

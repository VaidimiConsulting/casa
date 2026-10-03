import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Customer Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";

// Admin Pages & Guard
import AdminGuard from "./components/admin/AdminGuard";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Rooms from "./pages/admin/Rooms";
import Bookings from "./pages/admin/Bookings";
import PatioEvents from "./pages/admin/PatioEvents";
import Payments from "./pages/admin/Payments";
import Gallery from "./pages/admin/Gallery";
import Customers from "./pages/admin/Customers";
import Reviews from "./pages/admin/Reviews";
import Messages from "./pages/admin/Messages";
import Coupons from "./pages/admin/Coupons";
import Staff from "./pages/admin/Staff";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import CheckIn from "./pages/admin/CheckIn";
import Services from "./pages/admin/Services";
import Finance from "./pages/admin/Finance";

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import Catalog from "./pages/buyer/Catalog";
import Cart from "./pages/buyer/Cart";
import Checkout from "./pages/buyer/Checkout";
import Orders from "./pages/buyer/Orders";
import BuyerProfile from "./pages/buyer/Profile";
import CourierDashboard from "./pages/courier/CourierDashboard";
import ActiveOrders from "./pages/courier/ActiveOrders";
import OrderHistory from "./pages/courier/OrderHistory";
import CourierProfile from "./pages/courier/CourierProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* Buyer Routes */}
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/buyer/catalog" element={<Catalog />} />
            <Route path="/buyer/cart" element={<Cart />} />
            <Route path="/buyer/checkout" element={<Checkout />} />
            <Route path="/buyer/orders" element={<Orders />} />
            <Route path="/buyer/profile" element={<BuyerProfile />} />
            {/* Courier Routes */}
            <Route path="/courier" element={<CourierDashboard />} />
            <Route path="/courier/active" element={<ActiveOrders />} />
            <Route path="/courier/history" element={<OrderHistory />} />
            <Route path="/courier/profile" element={<CourierProfile />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;

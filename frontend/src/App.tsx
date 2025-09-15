import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Services from "./pages/Services";
import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerServices from "./pages/worker/Services";
import WorkerSchedule from "./pages/worker/Schedule";
import WorkerRequests from "./pages/worker/Requests";
import WorkerMessages from "./pages/worker/Messages";
import WorkerBookingsPage from "./pages/worker/Bookings";
import WorkerEarnings from "./pages/worker/Earnings";
import WorkerReviewsPage from "./pages/worker/Reviews";
import WorkerOffersPage from "./pages/worker/Offers";
import WorkerAnalytics from "./pages/worker/Analytics";
import WorkerSettings from "./pages/worker/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminBookings from "./pages/admin/Bookings";
import AdminWorkers from "./pages/admin/Workers";
import AdminServices from "./pages/admin/Services";
import AdminCategories from "./pages/admin/Categories";
import AdminPayments from "./pages/admin/Payments";
import WorkerPaymentDetails from "./pages/admin/WorkerPaymentDetails";
import AdminReviews from "./pages/admin/Reviews";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminCustomers from "./pages/admin/Customers";
import { WorkerAccountManagement as AdminWorkerAccountManagement } from "./pages/admin/WorkerAccountManagement";
import { AccountActivationRequests } from "./components/admin/AccountActivationRequests";
import { WorkerRouteProtection } from "./components/worker/WorkerRouteProtection";
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerBrowse from "./pages/customer/Browse";
import CustomerBookings from "./pages/customer/Bookings";
import CustomerMessages from "./pages/customer/Messages";
import CustomerOffers from "./pages/customer/Offers";
import { CustomerPayments } from "@/components/customer/CustomerPayments";
import { CustomerReviews } from "@/components/customer/CustomerReviews";
import { CustomerProfile } from "./pages/customer/Profile";
import { CustomerSettings } from "./pages/customer/Settings";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import EmailConfirmation from "./pages/auth/EmailConfirmation";
import BecomeWorker from "./pages/BecomeWorker";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import HowItWorks from "./pages/HowItWorks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminOtherThings from "./pages/admin/OtherThings";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component loaded');
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="services" element={<Services />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
              <Route path="become-worker" element={<BecomeWorker />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="email-confirmation" element={<EmailConfirmation />} />
              <Route path="auth" element={<Signup />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="payment-success" element={<PaymentSuccess />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/workers" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminWorkers />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminServices />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminCategories />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminPayments />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments/worker/:workerId" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <WorkerPaymentDetails />
              </ProtectedRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminReviews />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/other-things" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminOtherThings />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminCustomers />
              </ProtectedRoute>
            } />
                        <Route path="/admin/worker-accounts" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AdminWorkerAccountManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/activation-requests" element={
              <ProtectedRoute allowedUserTypes={['admin']}>
                <AccountActivationRequests />
              </ProtectedRoute>
            } />
            
            
            {/* Worker Routes */}
            <Route path="/worker" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/worker/services" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerServices />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/schedule" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerSchedule />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/requests" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerRequests />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/messages" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerMessages />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/bookings" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerBookingsPage />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/earnings" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerEarnings />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/reviews" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerReviewsPage />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/analytics" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerAnalytics />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/settings" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerSettings />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
            <Route path="/worker/offers" element={
              <ProtectedRoute allowedUserTypes={['worker']}>
                <WorkerRouteProtection>
                  <WorkerOffersPage />
                </WorkerRouteProtection>
              </ProtectedRoute>
            } />
          
            
            {/* Customer Routes */}
            <Route path="/customer" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/browse" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerBrowse />
              </ProtectedRoute>
            } />
            <Route path="/customer/bookings" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerBookings />
              </ProtectedRoute>
            } />
            <Route path="/customer/messages" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerMessages />
              </ProtectedRoute>
            } />
            <Route path="/customer/offers" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerOffers />
              </ProtectedRoute>
            } />
            <Route path="/customer/payments" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerPayments />
              </ProtectedRoute>
            } />
            <Route path="/customer/reviews" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerReviews />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/customer/settings" element={
              <ProtectedRoute allowedUserTypes={['customer']}>
                <CustomerSettings />
              </ProtectedRoute>
            } />
         
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
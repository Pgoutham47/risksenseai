import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { NotificationProvider } from "@/hooks/useNotifications";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AgencyDirectory from "@/pages/AgencyDirectory";
import AgencyProfile from "@/pages/AgencyProfile";
import AlertsCenter from "@/pages/AlertsCenter";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Simulator from "@/pages/Simulator";
import AuditLog from "@/pages/AuditLog";
import ReportBuilder from "@/pages/ReportBuilder";
import ReasoningDemo from "@/pages/ReasoningDemo";
import APIMonitor from "@/pages/APIMonitor";
import FrameworkExplanation from "@/pages/FrameworkExplanation";
import NotFound from "@/pages/NotFound";
import { DataProvider } from "@/contexts/DataContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <ThemeProvider>
            <TooltipProvider>
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                    <Route path="/agencies" element={<ProtectedRoute><Layout><AgencyDirectory /></Layout></ProtectedRoute>} />
                    <Route path="/agency/:id" element={<ProtectedRoute><Layout><AgencyProfile /></Layout></ProtectedRoute>} />
                    <Route path="/alerts" element={<ProtectedRoute><Layout><AlertsCenter /></Layout></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                    <Route path="/simulator" element={<ProtectedRoute><Layout><Simulator /></Layout></ProtectedRoute>} />
                    <Route path="/audit-log" element={<ProtectedRoute><Layout><AuditLog /></Layout></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Layout><ReportBuilder /></Layout></ProtectedRoute>} />
                    <Route path="/reasoning-demo" element={<ProtectedRoute><Layout><ReasoningDemo /></Layout></ProtectedRoute>} />
                    <Route path="/api-monitor" element={<ProtectedRoute><Layout><APIMonitor /></Layout></ProtectedRoute>} />
                    <Route path="/framework" element={<ProtectedRoute><Layout><FrameworkExplanation /></Layout></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </NotificationProvider>
            </TooltipProvider>
          </ThemeProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ShiftsProvider } from "@/hooks/ShiftsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import NewShift from "./pages/NewShift";
import EditShift from "./pages/EditShift";
import Coverage from "./pages/Coverage";
import Summary from "./pages/Summary";
import Caregivers from "./pages/Caregivers";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ShiftsProvider>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </ShiftsProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-shift"
                element={
                  <ProtectedRoute>
                    <ShiftsProvider>
                      <AppLayout>
                        <NewShift />
                      </AppLayout>
                    </ShiftsProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-shift/:id"
                element={
                  <ProtectedRoute>
                    <ShiftsProvider>
                      <AppLayout>
                        <EditShift />
                      </AppLayout>
                    </ShiftsProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coverage"
                element={
                  <ProtectedRoute>
                    <ShiftsProvider>
                      <AppLayout>
                        <Coverage />
                      </AppLayout>
                    </ShiftsProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/summary"
                element={
                  <ProtectedRoute>
                    <ShiftsProvider>
                      <AppLayout>
                        <Summary />
                      </AppLayout>
                    </ShiftsProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/caregivers"
                element={
                  <ProtectedRoute>
                    <ShiftsProvider>
                      <AppLayout>
                        <Caregivers />
                      </AppLayout>
                    </ShiftsProvider>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;

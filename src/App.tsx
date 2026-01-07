import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import NewShift from "./pages/NewShift";
import Coverage from "./pages/Coverage";
import Summary from "./pages/Summary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/new-shift" element={<NewShift />} />
              <Route path="/coverage" element={<Coverage />} />
              <Route path="/summary" element={<Summary />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;

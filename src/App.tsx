import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Collector from "./pages/Collector";
import Processor from "./pages/Processor";
import RoleSelection from "./pages/RoleSelection";
import NotFound from "./pages/NotFound";
import Whitepaper from "./pages/Whitepaper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/select-role" element={<RoleSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/collector" element={<Collector />} />
              <Route path="/processor" element={<Processor />} />
              <Route path="/whitepaper" element={<Whitepaper />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

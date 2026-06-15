import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ReadyForAssemblyPage from '@/pages/ReadyForAssemblyPage';
import AssemblyPage from '@/pages/AssemblyPage';
import FipsPage from '@/pages/FipsPage';
import QualityCheckPage from '@/pages/QualityCheckPage';
import BhStoragePage from '@/pages/BhStoragePage';
import StorageManagementPage from '@/pages/StorageManagementPage';
import DeliveryPage from '@/pages/DeliveryPage';
import SiteManagementPage from '@/pages/SiteManagementPage';
import ReturnsPage from '@/pages/ReturnsPage';
import MovementHistoryPage from '@/pages/MovementHistoryPage';
import ReportsPage from '@/pages/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/ready-for-assembly" element={<ProtectedRoute><AppLayout><ReadyForAssemblyPage /></AppLayout></ProtectedRoute>} />
      <Route path="/assembly" element={<ProtectedRoute><AppLayout><AssemblyPage /></AppLayout></ProtectedRoute>} />
      <Route path="/fips" element={<ProtectedRoute><AppLayout><FipsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/quality-check" element={<ProtectedRoute><AppLayout><QualityCheckPage /></AppLayout></ProtectedRoute>} />
      <Route path="/storage/bh" element={<ProtectedRoute><AppLayout><BhStoragePage /></AppLayout></ProtectedRoute>} />
      <Route path="/storage/:code" element={<ProtectedRoute><AppLayout><BhStoragePage /></AppLayout></ProtectedRoute>} />
      <Route path="/storage" element={<ProtectedRoute><AppLayout><StorageManagementPage /></AppLayout></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><AppLayout><DeliveryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/sites" element={<ProtectedRoute><AppLayout><SiteManagementPage /></AppLayout></ProtectedRoute>} />
      <Route path="/returns" element={<ProtectedRoute><AppLayout><ReturnsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/movements" element={<ProtectedRoute><AppLayout><MovementHistoryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster richColors position="top-center" className="sm:!top-4 sm:!right-4 sm:!left-auto" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

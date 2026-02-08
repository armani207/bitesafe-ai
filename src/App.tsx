import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useProfile } from "./hooks/useSupabase";

// Lazy-load pages to reduce initial bundle and improve load time
const Index = lazy(() => import("./pages/Index"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const MealDetailPage = lazy(() => import("./pages/MealDetailPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const GlucosePage = lazy(() => import("./pages/GlucosePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Dev bypass: set VITE_DEV_BYPASS_AUTH=true in .env.local to skip auth when coding
const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

// Protected route wrapper - requires auth and onboarding
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (DEV_BYPASS_AUTH) {
    return <>{children}</>;
  }
  
  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your health data...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (!profile?.is_onboarded) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Component to initialize realtime sync
function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function AppRoutes() {
  return (
    <RealtimeSyncProvider>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <ScanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:mealId"
          element={
            <ProtectedRoute>
              <MealDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <InsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/glucose"
          element={
            <ProtectedRoute>
              <GlucosePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </RealtimeSyncProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const MemberLoginPage = lazy(() => import('@/pages/auth/MemberLoginPage').then((m) => ({ default: m.MemberLoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));

// Lazy-loaded Feature Pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const MembersPage = lazy(() => import('@/pages/MembersPage').then((m) => ({ default: m.MembersPage })));
const ChaptersPage = lazy(() => import('@/pages/ChaptersPage').then((m) => ({ default: m.ChaptersPage })));
const EventsPage = lazy(() => import('@/pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const ServicesPage = lazy(() => import('@/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const GigPage = lazy(() => import('@/pages/GigPage').then((m) => ({ default: m.GigPage })));
const ReadingsPage = lazy(() => import('@/pages/ReadingsPage').then((m) => ({ default: m.ReadingsPage })));
const MemberPortalPage = lazy(() => import('@/pages/MemberPortalPage').then((m) => ({ default: m.MemberPortalPage })));
const ChangelogsPage = lazy(() => import('@/pages/ChangelogsPage').then((m) => ({ default: m.ChangelogsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <Spinner size="lg" />
    <span className="text-xs text-text-muted font-medium">Loading view...</span>
  </div>
);

const RootRedirect: React.FC = () => {
  const { token, user } = useAuthStore();
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'member') {
    return <Navigate to="/member" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/member-login" element={<MemberLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Member Portal Dedicated Route */}
            <Route
              path="/member"
              element={
                <ProtectedRoute>
                  <MemberPortalPage />
                </ProtectedRoute>
              }
            />

            {/* Servant Leader Protected App Shell Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/chapters" element={<ChaptersPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/gig" element={<GigPage />} />
              <Route path="/readings" element={<ReadingsPage />} />
              <Route path="/changelogs" element={<ChangelogsPage />} />
            </Route>

            {/* Root and Fallback */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

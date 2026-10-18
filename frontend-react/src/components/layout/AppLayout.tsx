import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import type { UserProfile } from '@/types/auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OfflineBanner } from './OfflineBanner';
import { SimulationBanner } from './SimulationBanner';
import { AreaSwitchModal } from './AreaSwitchModal';

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, updateUser } = useAuthStore();

  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient<{ ok: boolean; user: UserProfile }>('/auth/me'),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (meData?.user) {
      updateUser(meData.user);
    }
  }, [meData, updateUser]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-navy focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-amber-400"
      >
        Skip to main content
      </a>

      <OfflineBanner />
      <SimulationBanner />
      <AreaSwitchModal />

      {/* Desktop and mobile drawer sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app viewport wrapper */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
        />

        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-8 sm:pb-12 focus:outline-none"
          tabIndex={-1}
        >
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

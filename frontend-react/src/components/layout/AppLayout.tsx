import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import type { UserProfile } from '@/types/auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
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
      <OfflineBanner />
      <SimulationBanner />
      <AreaSwitchModal />

      {/* Desktop and mobile drawer sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app viewport wrapper */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 focus:outline-none" tabIndex={-1}>
          {children ?? <Outlet />}
        </main>

        {/* Mobile bottom navigation */}
        <MobileNav onOpenMenu={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};

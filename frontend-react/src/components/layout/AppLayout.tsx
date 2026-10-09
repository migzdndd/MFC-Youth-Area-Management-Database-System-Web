import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { OfflineBanner } from './OfflineBanner';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <OfflineBanner />

      {/* Desktop and mobile drawer sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app viewport wrapper */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 focus:outline-none" tabIndex={-1}>
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <MobileNav onOpenMenu={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};

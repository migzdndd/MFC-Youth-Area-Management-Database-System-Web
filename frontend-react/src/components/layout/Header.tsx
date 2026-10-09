import React from 'react';
import { Menu, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeArea } = useAuthStore();

  const currentAreaName = activeArea?.name || user?.area_name || 'My Area';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border-subtle h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Area Indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-text-muted hover:text-text-main rounded-md hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-navy" />
            <span>{currentAreaName}</span>
          </div>
          {user?.role === 'national_coordinator' && (
            <span className="hidden md:inline-block text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
              National Context
            </span>
          )}
        </div>
      </div>

      {/* Right: User identity tag */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[160px]">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
          </span>
          <span className="text-[11px] text-slate-500 capitalize font-medium">
            {user?.role ? user.role.replace(/_/g, ' ') : 'Servant'}
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-navy text-white text-xs font-bold ring-2 ring-amber-400/30 flex items-center justify-center select-none shrink-0 shadow-2xs">
          {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};

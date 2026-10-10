import React from 'react';
import { Menu, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeArea } = useAuthStore();

  const currentAreaName = activeArea?.name || user?.area_name || 'Area Community';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-border-subtle h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      {/* Left: Mobile hamburger & Area Indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/90 rounded-full text-xs font-semibold text-slate-800 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-navy" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{currentAreaName}</span>
          </div>
          {user?.role === 'national_coordinator' && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/90">
              National Context
            </span>
          )}
        </div>
      </div>

      {/* Right: User identity tag */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[160px]">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
          </span>
          <span className="text-[11px] text-amber-700 capitalize font-semibold">
            {user?.role ? user.role.replace(/_/g, ' ') : 'Servant'}
          </span>
        </div>
        <div
          className="w-9 h-9 rounded-full bg-navy text-white text-xs font-bold ring-2 ring-amber-400/40 flex items-center justify-center select-none shrink-0 shadow-2xs"
          title={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
        >
          {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};


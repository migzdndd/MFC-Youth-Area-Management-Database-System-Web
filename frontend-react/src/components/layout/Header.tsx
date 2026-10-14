import React from 'react';
import { Menu, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useAreas } from '@/hooks/useDashboard';
import type { Area } from '@/types/auth';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeArea, requestAreaSwitch } = useAuthStore();
  const { data: areas = [] } = useAreas();
  const queryClient = useQueryClient();

  const matchedArea = areas.find((a: Area) => a.id === (activeArea?.id || user?.area_id));
  const currentAreaName = activeArea?.name || user?.area_name || matchedArea?.name || (areas.length > 0 ? areas[0].name : 'MFC Youth Area Database');
  const canSwitchArea = (user?.role === 'national_coordinator' || user?.is_developer) && areas.length > 0;

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
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          {canSwitchArea ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-navy shrink-0" aria-hidden="true" />
              <label htmlFor="headerAreaSelect" className="sr-only">Switch active area</label>
              <select
                id="headerAreaSelect"
                value={activeArea?.id || user?.area_id || ''}
                onChange={(e) => {
                  const selected = areas.find((a: Area) => a.id === e.target.value);
                  const switched = requestAreaSwitch(selected || null);
                  if (switched) {
                    queryClient.clear();
                  }
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[220px] truncate"
              >
                {areas.map((a: Area) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.id === user?.area_id ? '(Home)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/90 rounded-full text-xs font-semibold text-slate-800 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-navy shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{currentAreaName}</span>
            </div>
          )}

          {user?.role === 'national_coordinator' && (
            <span className="hidden md:inline-block text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/90">
              National Context
            </span>
          )}
          {user?.is_developer && activeArea && user?.area_id && activeArea.id !== user.area_id && (
            <span className="hidden md:inline-block text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
              Area Simulation
            </span>
          )}
        </div>
      </div>

      {/* Right: User identity tag */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[160px]">
            {user?.first_name ? [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ') : user?.email}
          </span>
          <span className="text-[11px] text-amber-700 capitalize font-semibold">
            {user?.role ? user.role.replace(/_/g, ' ') : 'Servant'}
          </span>
        </div>
        <div
          className="w-9 h-9 rounded-full bg-navy text-white text-xs font-bold ring-2 ring-amber-400/40 flex items-center justify-center select-none shrink-0 shadow-2xs"
          title={user?.first_name ? [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ') : user?.email}
        >
          {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};


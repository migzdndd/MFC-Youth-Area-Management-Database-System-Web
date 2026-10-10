import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  BookOpen,
  History,
  LogOut,
  X,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ROLE_ALLOWED_PAGES } from '@/types/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', pageKey: 'dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', pageKey: 'members', icon: Users },
    { name: 'Chapters', path: '/chapters', pageKey: 'chapters', icon: Building2 },
    { name: 'Services', path: '/services', pageKey: 'services', icon: Briefcase },
    { name: 'Activity Reports', path: '/reports', pageKey: 'reports', icon: FileText },
    { name: 'Events', path: '/events', pageKey: 'events', icon: Calendar },
    { name: 'Daily Readings', path: '/readings', pageKey: 'readings', icon: BookOpen },
    { name: 'Changelogs', path: '/changelogs', pageKey: 'changelogs', icon: History },
  ];

  const allowedPages = user?.role ? ROLE_ALLOWED_PAGES[user.role] || [] : [];
  const filteredNavItems = navItems.filter((item) => allowedPages.includes(item.pageKey));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy-deep/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-deep text-white flex flex-col transition-transform duration-250 ease-out lg:translate-x-0 border-r border-navy-surface shadow-xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/15 shadow-2xs shrink-0">
              <img
                src="/img/logo-2.png"
                alt="MFC Youth Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider leading-tight text-white font-heading">
                MFC YOUTH
              </h2>
              <p className="text-[10px] text-amber-300 font-semibold tracking-widest mt-0.5">
                AREA MANAGEMENT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] select-none ${
                    isActive
                      ? 'bg-white/12 text-white font-semibold border-l-[3px] border-amber-400 pl-2.5 shadow-2xs'
                      : 'text-slate-300 hover:bg-white/7 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User status and logout */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-navy-surface/60">
          <div className="bg-white/5 rounded-lg p-3 border border-white/8 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs truncate max-w-[150px]">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
              </span>
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                {user?.role ? user.role.replace(/_/g, ' ') : 'Servant'}
              </span>
            </div>
            {user?.area_name && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5 truncate">
                <MapPin className="w-3 h-3 text-amber-300/80 shrink-0" />
                <span className="truncate">{user.area_name}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-200 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-400/20 rounded-lg transition-all duration-150 min-h-[44px] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="text-[10px] text-slate-400/80 text-center">
            MFC Youth AMS v1.1
          </div>
        </div>
      </aside>
    </>
  );
};


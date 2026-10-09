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
          className="fixed inset-0 bg-navy/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-deep text-white flex flex-col transition-transform duration-200 lg:translate-x-0 border-r border-navy-surface ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/img/logo-2.png"
              alt="MFC Youth Logo"
              width={38}
              height={38}
              className="rounded"
            />
            <div>
              <h2 className="text-sm font-bold tracking-wider leading-tight text-white font-heading">
                MFC YOUTH
              </h2>
              <p className="text-[10px] text-amber-300 font-semibold tracking-wider">
                AREA MANAGEMENT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-white/70 hover:text-white rounded"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border-l-[3px] border-amber-400 pl-2.5'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User status and logout */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-navy-surface/40">
          <div className="flex flex-col text-xs text-slate-300">
            <span className="font-semibold text-white truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
            </span>
            <span className="text-[11px] text-amber-300 capitalize font-medium">
              {user?.role?.replace(/_/g, ' ')}
            </span>
            {user?.area_name && (
              <span className="text-[11px] text-slate-400 truncate">
                Area: {user.area_name}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-200 hover:text-white bg-white/5 hover:bg-rose-950/40 border border-white/10 rounded-md transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="text-[10px] text-slate-500 text-center pt-1">
            MFC Youth AMS v1.1
          </div>
        </div>
      </aside>
    </>
  );
};

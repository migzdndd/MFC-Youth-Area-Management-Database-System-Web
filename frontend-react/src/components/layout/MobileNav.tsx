import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Menu } from 'lucide-react';

interface MobileNavProps {
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around px-2 py-1 shadow-lg"
      aria-label="Mobile navigation"
    >
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] text-[11px] font-semibold transition-all duration-150 relative select-none ${
                isActive
                  ? 'text-navy font-bold after:absolute after:bottom-0.5 after:w-5 after:h-[3px] after:bg-amber-500 after:rounded-full'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{link.name}</span>
          </NavLink>
        );
      })}

      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] text-[11px] font-semibold text-slate-500 hover:text-slate-900 active:scale-95 transition-all select-none cursor-pointer"
        aria-label="Open complete menu"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};


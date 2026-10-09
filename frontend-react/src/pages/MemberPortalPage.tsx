import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useEvents } from '@/hooks/useEvents';
import { useGigRecords } from '@/hooks/useGig';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Calendar, HeartHandshake, LogOut, Clock, MapPin } from 'lucide-react';

export const MemberPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: events = [] } = useEvents();
  const { data: gigRecords = [] } = useGigRecords();

  const handleLogout = () => {
    logout();
    navigate('/member-login');
  };

  // Filter personal GIG records
  const personalGig = gigRecords.filter((g) => g.member_id === user?.member_id);
  const totalPersonalGig = personalGig.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top Bar */}
      <header className="bg-navy-deep text-white px-4 sm:px-8 py-4 flex items-center justify-between border-b border-navy-surface shadow-2xs">
        <div className="flex items-center gap-3">
          <img src="/img/logo-2.png" alt="MFC Youth" width={36} height={36} />
          <div>
            <h1 className="text-sm font-bold tracking-wider leading-tight text-white font-heading">
              MFC YOUTH
            </h1>
            <p className="text-[10px] text-amber-300 font-semibold tracking-wider">
              MEMBER PORTAL
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          <span>Sign Out</span>
        </Button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-navy text-white font-bold text-xl ring-2 ring-amber-400/30 flex items-center justify-center font-heading shadow-2xs">
              {user?.first_name ? user.first_name[0].toUpperCase() : 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-main font-heading">
                  {user?.first_name} {user?.last_name || ''}
                </h2>
                <Badge variant="navy">Member</Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                <span>Area: <strong className="text-text-main">{user?.area_name || 'My Area'}</strong></span>
                {user?.chapter_name && (
                  <span>&middot; Chapter: <strong className="text-text-main">{user.chapter_name}</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Upcoming Gatherings */}
        <section className="bg-white border border-border-subtle rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
            <Calendar className="w-5 h-5 text-navy" />
            <h3 className="font-bold text-text-main text-base font-heading">
              Upcoming Gatherings & Camps
            </h3>
          </div>

          {events.length === 0 ? (
            <p className="text-xs text-text-muted py-4">No scheduled events at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-border-subtle bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-text-main">{event.name}</h4>
                    <Badge variant={event.fee > 0 ? 'warning' : 'success'}>
                      {event.fee > 0 ? formatCurrency(event.fee) : 'Free'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(event.starts_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section: My GIG Tithes */}
        <section className="bg-white border border-border-subtle rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-navy" />
              <h3 className="font-bold text-text-main text-base font-heading">
                My GIG Tithes & Offerings
              </h3>
            </div>
            <span className="text-sm font-bold text-navy">
              Total: {formatCurrency(totalPersonalGig)}
            </span>
          </div>

          {personalGig.length === 0 ? (
            <p className="text-xs text-text-muted py-4">
              No individual GIG records logged yet. Your servant leader records contributions following household assemblies.
            </p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {personalGig.map((g) => (
                <div key={g.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-text-muted">{g.contribution_date}</span>
                  <span className="font-bold text-navy">{formatCurrency(g.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

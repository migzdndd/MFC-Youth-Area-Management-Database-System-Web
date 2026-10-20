import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useEvents } from '@/hooks/useEvents';
import { useGigRecords } from '@/hooks/useGig';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Calendar, HeartHandshake, LogOut, Clock, MapPin, QrCode } from 'lucide-react';
import { SimulationBanner } from '@/components/layout/SimulationBanner';
import { AreaSwitchModal } from '@/components/layout/AreaSwitchModal';
import { MemberDigitalPassModal } from '@/components/member/MemberDigitalPassModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export const MemberPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: events = [] } = useEvents();
  const { data: gigRecords = [] } = useGigRecords();
  const [isPassOpen, setIsPassOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/member-login');
  };

  // Filter personal GIG records
  const personalGig = gigRecords.filter((g) => g.member_id === user?.member_id);
  const totalPersonalGig = personalGig.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-canvas">
      <SimulationBanner />
      <AreaSwitchModal />

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

        <div className="flex items-center gap-2">
          <ThemeToggle className="text-white hover:text-amber-300 hover:bg-white/10 border-white/10" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 card-interactive">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white font-bold text-2xl ring-4 ring-amber-400/20 flex items-center justify-center font-heading shadow-md shrink-0">
              {user?.first_name ? user.first_name[0].toUpperCase() : 'M'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading mb-1">
                {[user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(' ') || 'Youth Member'}
              </h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-2">
                <span className="bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">Area: <strong className="text-navy">{user?.area_name || 'MFC Youth Area Database'}</strong></span>
                {user?.chapter_name && (
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">Chapter: <strong className="text-navy">{user.chapter_name}</strong></span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsPassOpen(true)}
            className="flex items-center gap-2 min-h-[44px] shrink-0 w-full sm:w-auto justify-center"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>My Digital Event Pass</span>
          </Button>
        </div>

        {/* Section: Upcoming Gatherings */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-5 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-navy" />
              <h3 className="font-bold text-slate-900 text-base font-heading">
                Upcoming Gatherings & Camps
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Area Activities</span>
          </div>

          {events.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No scheduled events at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all duration-150 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{event.name}</h4>
                    <Badge variant={event.fee > 0 ? 'warning' : 'success'}>
                      {event.fee > 0 ? formatCurrency(event.fee) : 'Free'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-navy shrink-0" />
                      <span>{formatDateTime(event.starts_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section: My GIG Tithes */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-navy" />
              <h3 className="font-bold text-slate-900 text-base font-heading">
                My GIG Tithes & Offerings
              </h3>
            </div>
            <span className="text-xs font-bold bg-navy/10 text-navy px-3 py-1 rounded-full">
              Total Given: {formatCurrency(totalPersonalGig)}
            </span>
          </div>

          {personalGig.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No individual GIG records logged yet. Your servant leader records contributions following household assemblies.
            </p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {personalGig.map((g) => (
                <div key={g.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                  <span className="text-slate-600 font-medium">{g.contribution_date}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                    {formatCurrency(g.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {isPassOpen && (
        <MemberDigitalPassModal
          isOpen={isPassOpen}
          onClose={() => setIsPassOpen(false)}
          user={user}
          events={events}
        />
      )}
    </div>
  );
};

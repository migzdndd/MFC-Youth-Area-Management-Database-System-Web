import React, { useState } from 'react';
import { Music, Camera, Palette, PenTool, Flame, Users, Search } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useChapters } from '@/hooks/useChapters';
import { Modal } from '@/components/ui/Modal';
import type { Member } from '@/types/member';

export const ServicesPage: React.FC = () => {
  const { data: members = [] } = useMembers();
  const { data: chapters = [] } = useChapters();
  const [selectedService, setSelectedService] = useState<{
    title: string;
    icon: React.ElementType;
    description: string;
    tag: string;
    matchKeys: string[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const creativeMinistries = [
    {
      title: 'Music',
      icon: Music,
      description: 'Instrumentalists, vocalists, and psalmists dedicated to liturgical music, praise, and worship.',
      tag: 'Liturgical Creative',
      matchKeys: ['music', 'music ministry'],
    },
    {
      title: 'Dance',
      icon: Flame,
      description: 'Creative interpretive movement and choreography for youth conferences, camps, and rallies.',
      tag: 'Creative Liturgical',
      matchKeys: ['dance'],
    },
    {
      title: 'Graphics & Promo',
      icon: Palette,
      description: 'Visual branding, promotional posters, event banners, and digital evangelization graphics.',
      tag: 'Creative Production',
      matchKeys: ['graphics', 'promo', 'graphics & promo'],
    },
    {
      title: 'Creative Writing',
      icon: PenTool,
      description: 'Pastoral reflections, assembly scripts, social media articles, and youth faith testimonies.',
      tag: 'Pastoral Content',
      matchKeys: ['creative writing', 'writing'],
    },
    {
      title: 'Photography & Videography',
      icon: Camera,
      description: 'Event photojournalism, recap videos, testimony recordings, and media production.',
      tag: 'Media Production',
      matchKeys: ['photography', 'videography', 'photo', 'photography & videography'],
    },
  ];

  const getServants = (matchKeys: string[]) => {
    return members.filter((m) => {
      const activeService = (m.service || '').toLowerCase();
      const assigned = Array.isArray(m.assigned_services)
        ? m.assigned_services.map((s) => s.toLowerCase())
        : [];
      return matchKeys.some(
        (key) => activeService === key || activeService.includes(key) || assigned.some((as) => as === key || as.includes(key))
      );
    });
  };

  const getServantCount = (matchKeys: string[]) => {
    return getServants(matchKeys).length;
  };

  const selectedServiceMembers = selectedService ? getServants(selectedService.matchKeys) : [];
  const filteredModalMembers = selectedServiceMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
    const nickname = (m.nickname || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    return fullName.includes(q) || nickname.includes(q) || email.includes(q);
  });

  const getChapterName = (chapterId?: string | null) => {
    if (!chapterId) return 'Unassigned Chapter';
    const found = chapters.find((c) => c.id === chapterId);
    return found ? found.name : 'Unassigned Chapter';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
          Creative Ministry Services
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creativeMinistries.map((service) => {
          const Icon = service.icon;
          const servantCount = getServantCount(service.matchKeys);

          return (
            <div
              key={service.title}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedService(service);
                setSearchQuery('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedService(service);
                  setSearchQuery('');
                }
              }}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-slate-300 active:scale-[0.99] transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-navy/10 text-navy group-hover:scale-105 transition-transform duration-150">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-navy/10 group-hover:text-navy transition-colors">
                    View Servants
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 font-heading group-hover:text-navy transition-colors">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {service.description}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>LIT Creative Pillar</span>
                <span className="font-semibold text-navy text-xs">
                  {servantCount} {servantCount === 1 ? 'Servant' : 'Servants'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Assigned Members Modal */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={`Assigned Servants - ${selectedService?.title || ''} Ministry`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-600">
              Total assigned: <span className="font-bold text-navy">{selectedServiceMembers.length}</span> member{selectedServiceMembers.length === 1 ? '' : 's'}
            </p>
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="serviceServantSearch"
                type="text"
                aria-label="Search assigned servants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search servant..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
            {filteredModalMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center">
                <Users className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-medium">No servants assigned</p>
                <p className="text-slate-400 mt-1">
                  {searchQuery ? 'No members match your search.' : 'Members with this service will appear here.'}
                </p>
              </div>
            ) : (
              filteredModalMembers.map((member: Member) => (
                <div key={member.id} className="p-3 sm:p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}
                      </p>
                      {member.nickname && (
                        <span className="text-xs text-slate-500">"{member.nickname}"</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                      <span>{getChapterName(member.chapter_id)}</span>
                      {member.academic_track && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{member.academic_track}</span>
                        </>
                      )}
                      {member.email && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[180px]">{member.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

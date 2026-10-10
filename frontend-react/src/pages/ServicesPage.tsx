import React from 'react';
import { Music, Camera, Palette, PenTool, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useMembers } from '@/hooks/useMembers';

export const ServicesPage: React.FC = () => {
  const { data: members = [] } = useMembers();

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

  const getServantCount = (matchKeys: string[]) => {
    return members.filter((m) => {
      const activeService = (m.service || '').toLowerCase();
      const assigned = Array.isArray(m.assigned_services)
        ? m.assigned_services.map((s) => s.toLowerCase())
        : [];
      return matchKeys.some(
        (key) => activeService === key || activeService.includes(key) || assigned.some((as) => as === key || as.includes(key))
      );
    }).length;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
            Creative Ministry Services
          </h1>
          <Badge variant="gold">5 Pillars</Badge>
        </div>
        <p className="text-sm text-slate-600">
          The 5 official creative ministries overseen by LIT Servants for youth talents and evangelization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creativeMinistries.map((service) => {
          const Icon = service.icon;
          const servantCount = getServantCount(service.matchKeys);

          return (
            <div
              key={service.title}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-navy/10 text-navy group-hover:scale-105 transition-transform duration-150">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="navy">{service.tag}</Badge>
                </div>

                <h3 className="font-bold text-base text-slate-900 font-heading mb-2 group-hover:text-navy transition-colors">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>LIT Creative Pillar</span>
                <span className="font-bold text-navy bg-navy/10 px-2.5 py-0.5 rounded-full">
                  {servantCount} {servantCount === 1 ? 'Servant' : 'Servants'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
      <div className="pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Creative Ministry Services
          </h1>
          <Badge variant="navy">5 Pillars</Badge>
        </div>
        <p className="text-sm text-text-muted mt-1">
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
              className="bg-white border border-border-subtle rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-navy/10 text-navy">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="navy">{service.tag}</Badge>
                </div>

                <h3 className="font-bold text-base text-text-main font-heading mb-1.5">
                  {service.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-border-subtle text-xs text-slate-400 flex items-center justify-between">
                <span>LIT Creative Pillar</span>
                <span className="font-semibold text-navy">
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

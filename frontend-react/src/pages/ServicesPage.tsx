import React from 'react';
import { Music, Video, Truck, Sparkles, Users2, Camera, Palette, PenTool, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useMembers } from '@/hooks/useMembers';

export const ServicesPage: React.FC = () => {
  const { data: members = [] } = useMembers();

  const coreServices = [
    {
      title: 'Music Ministry',
      icon: Music,
      description: 'Leads liturgical praise and worship sessions during assemblies, camps, and youth masses.',
      tag: 'Creative Liturgical',
      matchKeys: ['music ministry'],
    },
    {
      title: 'Technical & Media (LIT)',
      icon: Video,
      description: 'Handles audio engineering, livestreaming, visual slides, and social media pastoral witness.',
      tag: 'Creative Production',
      matchKeys: ['technical', 'media', 'technical & media (lit)', 'area lit servant'],
    },
    {
      title: 'Logistics & Setup',
      icon: Truck,
      description: 'Oversees venue preparation, transport, equipment handling, and gathering logistics.',
      tag: 'Operations',
      matchKeys: ['logistics', 'logistics & setup'],
    },
    {
      title: 'Liturgical Servants',
      icon: Sparkles,
      description: 'Coordinates mass readers, altar servers, and prayer intercession for youth gatherings.',
      tag: 'Spiritual Formation',
      matchKeys: ['liturgical', 'liturgical servants', 'liturgy'],
    },
    {
      title: 'Mission Volunteers',
      icon: Users2,
      description: 'Outreach to campus students and high schools, evangelization camps, and charity apostolates.',
      tag: 'Apostolate',
      matchKeys: ['mission', 'mission volunteers'],
    },
  ];

  const creativeMinistries = [
    {
      title: 'Music',
      icon: Music,
      description: 'Instrumentalists, vocalists, and psalmists dedicated to liturgical music and praise.',
      tag: 'Creative Track',
      matchKeys: ['music', 'music ministry'],
    },
    {
      title: 'Dance',
      icon: Flame,
      description: 'Creative interpretive movement and stage choreography for youth conferences and camps.',
      tag: 'Creative Track',
      matchKeys: ['dance'],
    },
    {
      title: 'Graphics & Promo',
      icon: Palette,
      description: 'Visual branding, promotional flyers, event backdrops, and youth social media collateral.',
      tag: 'Creative Track',
      matchKeys: ['graphics', 'promo', 'graphics & promo'],
    },
    {
      title: 'Creative Writing',
      icon: PenTool,
      description: 'Pastoral reflections, assembly scripts, social copy, and youth community testimonies.',
      tag: 'Creative Track',
      matchKeys: ['creative writing', 'writing'],
    },
    {
      title: 'Photography & Videography',
      icon: Camera,
      description: 'High-definition photojournalism, event recaps, testimony videos, and livestream operations.',
      tag: 'Creative Track',
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
    <div className="space-y-8">
      <div className="pb-4 border-b border-border-subtle">
        <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
          Ministry Services Catalog
        </h1>
        <p className="text-sm text-text-muted">
          Active ministry tracks for youth talents, liturgical leadership, and missionary service.
        </p>
      </div>

      {/* 5 LIT Creative Ministries */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-main font-heading">
              LIT Creative Ministries
            </h2>
            <Badge variant="navy">5 Pillars</Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Overseen by LIT Servants for artistic, media, and digital pastoral evangelization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creativeMinistries.map((service) => {
            const Icon = service.icon;
            const servantCount = getServantCount(service.matchKeys);

            return (
              <div
                key={service.title}
                className="bg-white border border-border-subtle rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between"
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
                  <span>Creative Ministry Pillar</span>
                  <span className="font-semibold text-navy">
                    {servantCount} {servantCount === 1 ? 'Servant' : 'Servants'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Youth Service Tracks */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text-main font-heading">
            Core Youth Service Tracks
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Area operations, spiritual formation, logistics, and liturgical coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreServices.map((service) => {
            const Icon = service.icon;
            const servantCount = getServantCount(service.matchKeys);

            return (
              <div
                key={service.title}
                className="bg-white border border-border-subtle rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between"
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
                  <span>Youth Service Track</span>
                  <span className="font-semibold text-navy">
                    {servantCount} {servantCount === 1 ? 'Servant' : 'Servants'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

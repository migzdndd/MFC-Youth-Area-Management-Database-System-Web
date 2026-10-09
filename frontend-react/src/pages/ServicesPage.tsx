import React from 'react';
import { Music, Video, Truck, Sparkles, Users2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const ServicesPage: React.FC = () => {
  const ministryServices = [
    {
      title: 'Music Ministry',
      icon: Music,
      description: 'Leads liturgical praise and worship sessions during assemblies, camps, and youth masses.',
      tag: 'Creative Liturgical',
    },
    {
      title: 'Technical & Media (LIT)',
      icon: Video,
      description: 'Handles audio engineering, livestreaming, visual slides, and social media pastoral witness.',
      tag: 'Creative Production',
    },
    {
      title: 'Logistics & Setup',
      icon: Truck,
      description: 'Oversees venue preparation, transport, equipment handling, and gathering logistics.',
      tag: 'Operations',
    },
    {
      title: 'Liturgical Servants',
      icon: Sparkles,
      description: 'Coordinates mass readers, altar servers, and prayer intercession for youth gatherings.',
      tag: 'Spiritual Formation',
    },
    {
      title: 'Mission Volunteers',
      icon: Users2,
      description: 'Outreach to campus students and high schools, evangelization camps, and charity apostolates.',
      tag: 'Apostolate',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border-subtle">
        <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
          Ministry Services Catalog
        </h1>
        <p className="text-sm text-text-muted">
          Active ministry tracks for youth talents, liturgical leadership, and missionary service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ministryServices.map((service) => {
          const Icon = service.icon;
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

              <div className="pt-3 mt-4 border-t border-border-subtle text-xs text-slate-400">
                <span>Youth Service Track</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

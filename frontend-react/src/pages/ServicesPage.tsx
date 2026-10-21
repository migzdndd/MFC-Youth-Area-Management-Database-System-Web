import React, { useState, useMemo } from 'react';
import {
  Music,
  Camera,
  Palette,
  PenTool,
  Flame,
  Users,
  Search,
  GraduationCap,
  BookOpen,
  Heart,
  Building2,
  School,
  Edit3,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useMembers, useUpdateMember } from '@/hooks/useMembers';
import { useChapters } from '@/hooks/useChapters';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { MemberFormModal, type MemberFormData } from '@/components/member/MemberFormModal';
import type { Member, AcademicTrack } from '@/types/member';

interface ServiceCardConfig {
  title: string;
  icon: React.ElementType;
  description: string;
  tag: string;
  counterLabel: string;
  filter: (m: Member) => boolean;
  emptyLabel: string;
  targetTrack?: AcademicTrack;
  targetMinistry?: string;
  targetServantRole?: string;
}

export const ServicesPage: React.FC = () => {
  const { user, simulatedRole } = useAuthStore();
  const { data: members = [] } = useMembers();
  const { data: chapters = [] } = useChapters();
  const { data: servicesList = [] } = useServices();
  const updateMember = useUpdateMember();
  const toast = useToast();

  const [selectedService, setSelectedService] = useState<ServiceCardConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState('');

  const rawRole = simulatedRole || user?.role || (user as unknown as { access_level?: string })?.access_level || 'member';
  const role = String(rawRole).toLowerCase().trim().replace(/[\s-]+/g, '_');
  const canManageMembers = Boolean(
    role === 'national_coordinator' ||
    role === 'area_servant' ||
    role === 'couple_coordinator' ||
    role.includes('admin') ||
    role.includes('servant') ||
    role.includes('leader') ||
    role.includes('coordinator') ||
    role.includes('moderator')
  );

  const ministryOptions = useMemo(() => {
    const defaultServices = [
      'Music',
      'Dance',
      'Graphics & Promo',
      'Creative Writing',
      'Photography & Videography',
      'Campus Servant',
      'MFC High Servant',
      'Area LIT Servant',
      'Area Kids Servant',
      'Chapter Servant',
    ];
    const loadedNames = servicesList.map((s) => s.name);
    return Array.from(new Set([...defaultServices, ...loadedNames])).filter(Boolean);
  }, [servicesList]);

  // Role-specific Services configuration
  const { headerTitle, headerSubtitle, serviceCards } = useMemo(() => {
    const isCampusServant = role === 'campus_servant' || role.includes('campus');
    const isMfcHighServant = role === 'mfc_high_servant' || (role.includes('mfc') && role.includes('high')) || role === 'high_servant';
    const isAreaKidsServant = role === 'area_kids_servant' || role.includes('kids');
    const isLitServant = role === 'lit_servant' || role.includes('lit');
    // Helper to check appointed servant roles strictly
    const hasService = (m: Member, serviceKeywords: string[]) => {
      const active = (m.service || '').toLowerCase().trim();
      const assigned = Array.isArray(m.assigned_services)
        ? m.assigned_services.map((s) => s.toLowerCase().trim())
        : [];
      const access = ((m as Member & { access_level?: string }).access_level || '').toLowerCase().trim();

      return serviceKeywords.some((kw) => {
        const k = kw.toLowerCase().trim();
        return (
          active === k ||
          access === k ||
          assigned.includes(k)
        );
      });
    };

    // Helper for LIT Servant creative ministry assignments
    const hasCreativeMinistry = (m: Member, ministryKeywords: string[]) => {
      const active = (m.service || '').toLowerCase().trim();
      const assigned = Array.isArray(m.assigned_services)
        ? m.assigned_services.map((s) => s.toLowerCase().trim())
        : [];
      return ministryKeywords.some((kw) => {
        const k = kw.toLowerCase().trim();
        return (
          active === k ||
          active.includes(k) ||
          assigned.includes(k) ||
          assigned.some((as) => as.includes(k))
        );
      });
    };

    // 1. Campus Servant: College and Senior High School (SHS) Academic Tracks
    if (isCampusServant) {
      const cards: ServiceCardConfig[] = [
        {
          title: 'College Academic Track',
          icon: GraduationCap,
          tag: 'College Track',
          description: 'Active youth members attending college or university (1st to 4th Year).',
          counterLabel: 'College Members',
          targetTrack: 'College',
          filter: (m) => {
            const track = (m.academic_track || '').toLowerCase().trim();
            return track.includes('college');
          },
          emptyLabel: 'No members currently registered under College track.',
        },
        {
          title: 'SHS Academic Track',
          icon: School,
          tag: 'Senior High School Track',
          description: 'Pre-university youth members in Grades 11 and 12 transitioning to college or careers.',
          counterLabel: 'SHS Members',
          targetTrack: 'Senior High School',
          filter: (m) => {
            const track = (m.academic_track || '').toLowerCase().trim();
            return track.includes('senior') || track.includes('shs');
          },
          emptyLabel: 'No members currently registered under Senior High School track.',
        },
      ];

      return {
        headerTitle: 'College & SHS Academic Tracks',
        headerSubtitle: 'Academic track breakdown and member management for Senior High School (SHS) and College students.',
        serviceCards: cards,
      };
    }

    // 2. MFC High Servant: HS Academic Track
    if (isMfcHighServant) {
      const cards: ServiceCardConfig[] = [
        {
          title: 'HS Academic Track',
          icon: BookOpen,
          tag: 'High School Track',
          description: 'Secondary education youth members currently in the High School (HS) academic track.',
          counterLabel: 'HS Members',
          targetTrack: 'High School',
          filter: (m) => {
            const track = (m.academic_track || '').toLowerCase().trim();
            return (
              (track.includes('high school') && !track.includes('senior')) ||
              track.includes('junior') ||
              track === 'jhs' ||
              track === 'hs'
            );
          },
          emptyLabel: 'No members currently registered under High School (HS) track.',
        },
      ];

      return {
        headerTitle: 'HS Academic Track',
        headerSubtitle: 'Secondary education demographic management for High School (HS) youth.',
        serviceCards: cards,
      };
    }

    // 3. Area Kids Servant: Heartchamp Academic Track
    if (isAreaKidsServant) {
      const cards: ServiceCardConfig[] = [
        {
          title: 'Heartchamp Members',
          icon: Heart,
          tag: 'Heartchamp Track',
          description: 'Children and junior youth registered under the Heartchamp pastoral formation track.',
          counterLabel: 'Heartchamp Members',
          targetTrack: 'Heartchamp',
          filter: (m) => {
            const track = (m.academic_track || '').toLowerCase().trim();
            return track.includes('heartchamp') || track.includes('kids');
          },
          emptyLabel: 'No members currently registered under Heartchamp track.',
        },
      ];

      return {
        headerTitle: 'Heartchamp Members',
        headerSubtitle: 'Pastoral track and formation directory for Heartchamps and junior youth.',
        serviceCards: cards,
      };
    }

    // 4. LIT Servant: Creative Ministries (keep as is)
    if (isLitServant) {
      const cards: ServiceCardConfig[] = [
        {
          title: 'Music',
          icon: Music,
          tag: 'Liturgical Creative',
          description: 'Instrumentalists, vocalists, and psalmists dedicated to liturgical music, praise, and worship.',
          counterLabel: 'Music Servants',
          targetMinistry: 'Music',
          filter: (m) => hasCreativeMinistry(m, ['music', 'music ministry']),
          emptyLabel: 'No servants currently assigned to Music ministry.',
        },
        {
          title: 'Dance',
          icon: Flame,
          tag: 'Creative Liturgical',
          description: 'Creative interpretive movement and choreography for youth conferences, camps, and rallies.',
          counterLabel: 'Dance Servants',
          targetMinistry: 'Dance',
          filter: (m) => hasCreativeMinistry(m, ['dance']),
          emptyLabel: 'No servants currently assigned to Dance ministry.',
        },
        {
          title: 'Graphics & Promo',
          icon: Palette,
          tag: 'Creative Production',
          description: 'Visual branding, promotional posters, event banners, and digital evangelization graphics.',
          counterLabel: 'Graphics Servants',
          targetMinistry: 'Graphics & Promo',
          filter: (m) => hasCreativeMinistry(m, ['graphics', 'promo', 'graphics & promo']),
          emptyLabel: 'No servants currently assigned to Graphics & Promo ministry.',
        },
        {
          title: 'Creative Writing',
          icon: PenTool,
          tag: 'Pastoral Content',
          description: 'Pastoral reflections, assembly scripts, social media articles, and youth faith testimonies.',
          counterLabel: 'Writing Servants',
          targetMinistry: 'Creative Writing',
          filter: (m) => hasCreativeMinistry(m, ['creative writing', 'writing']),
          emptyLabel: 'No servants currently assigned to Creative Writing ministry.',
        },
        {
          title: 'Photography & Videography',
          icon: Camera,
          tag: 'Media Production',
          description: 'Event photojournalism, recap videos, testimony recordings, and media production.',
          counterLabel: 'Media Servants',
          targetMinistry: 'Photography & Videography',
          filter: (m) => hasCreativeMinistry(m, ['photography', 'videography', 'photo', 'photography & videography']),
          emptyLabel: 'No servants currently assigned to Photography & Videography ministry.',
        },
      ];

      return {
        headerTitle: 'Creative Ministry Services',
        headerSubtitle: 'The 5 creative pillars dedicated to youth evangelization through praise, worship, and multimedia.',
        serviceCards: cards,
      };
    }

    // 5. Area Servant, Couple Coordinator, National Coordinator, Developer (and Chapter Servant fallback)
    // They see the 5 Domain & Chapter Servant roles:
    // Campus Servant, MFC High Servant, LIT Servant, Area Kids Servant, Chapter Servant
    const leadershipCards: ServiceCardConfig[] = [
      {
        title: 'Campus Servant',
        icon: GraduationCap,
        tag: 'Domain Moderator',
        description: 'Supervises Senior High School (SHS) and College youth ministries across campus institutions.',
        counterLabel: 'Campus Servants',
        targetServantRole: 'Campus Servant',
        filter: (m) => hasService(m, ['campus_servant', 'campus servant']),
        emptyLabel: 'No Campus Servant currently appointed in the roster.',
      },
      {
        title: 'MFC High Servant',
        icon: BookOpen,
        tag: 'Domain Moderator',
        description: 'Supervises Junior High School (JHS Grades 7-10) youth evangelization and chapter activities.',
        counterLabel: 'MFC High Servants',
        targetServantRole: 'MFC High Servant',
        filter: (m) => hasService(m, ['mfc_high_servant', 'mfc high servant']),
        emptyLabel: 'No MFC High Servant currently appointed in the roster.',
      },
      {
        title: 'LIT Servant',
        icon: Flame,
        tag: 'Domain Moderator',
        description: 'Oversees the 5 Creative Ministries: Music, Dance, Graphics & Promo, Writing, and Video.',
        counterLabel: 'LIT Servants',
        targetServantRole: 'LIT Servant',
        filter: (m) => hasService(m, ['lit_servant', 'area lit servant', 'lit servant']),
        emptyLabel: 'No LIT Servant currently appointed in the roster.',
      },
      {
        title: 'Area Kids Servant',
        icon: Heart,
        tag: 'Domain Moderator',
        description: 'Coordinates pastoral accompaniment and assemblies for MFC Kids and Heartchamps.',
        counterLabel: 'Kids Servants',
        targetServantRole: 'Area Kids Servant',
        filter: (m) => hasService(m, ['area_kids_servant', 'area kids servant', 'kids servant']),
        emptyLabel: 'No Area Kids Servant currently appointed in the roster.',
      },
      {
        title: 'Chapter Servant',
        icon: Building2,
        tag: 'Chapter Leadership',
        description: 'Appointed chapter leaders managing local youth rosters, assemblies, and pastoral care.',
        counterLabel: 'Chapter Servants',
        targetServantRole: 'Chapter Servant',
        filter: (m) => hasService(m, ['chapter_servant', 'chapter servant']),
        emptyLabel: 'No Chapter Servants currently appointed in the roster.',
      },
    ];

    return {
      headerTitle: 'Area Servant Leadership Directory',
      headerSubtitle: 'Administrative oversight of appointed servant leaders and domain ministry moderators.',
      serviceCards: leadershipCards,
    };
  }, [role]);

  // Compute matched members for current modal view
  const selectedServiceMembers = useMemo(() => {
    if (!selectedService) return [];
    return members.filter(selectedService.filter);
  }, [selectedService, members]);

  const filteredModalMembers = useMemo(() => {
    if (!searchQuery.trim()) return selectedServiceMembers;
    const q = searchQuery.toLowerCase();
    return selectedServiceMembers.filter((m) => {
      const fullName = [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
      const nickname = (m.nickname || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const track = (m.academic_track || '').toLowerCase();
      const school = (m as Member & { school?: string }).school?.toLowerCase() || '';
      return (
        fullName.includes(q) ||
        nickname.includes(q) ||
        email.includes(q) ||
        track.includes(q) ||
        school.includes(q)
      );
    });
  }, [selectedServiceMembers, searchQuery]);

  const getChapterName = (chapterId?: string | null) => {
    if (!chapterId) return 'Unassigned Chapter';
    const found = chapters.find((c) => c.id === chapterId);
    return found ? found.name : 'Unassigned Chapter';
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveMember = async (formData: MemberFormData) => {
    if (!editingMember) return;
    const memberFullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');

    const payload = {
      id: editingMember.id,
      first_name: formData.firstName,
      middle_name: formData.middleName || null,
      last_name: formData.lastName,
      nickname: formData.nickname || null,
      gender: formData.gender,
      chapter_id: formData.chapterId || null,
      academic_track: formData.track,
      service: formData.service || null,
      assigned_services: formData.service ? [formData.service] : [],
      contact_number: formData.contact || null,
      contact: formData.contact || null,
      email: formData.email,
      status: formData.status,
      guardian_name: formData.guardianName || null,
      guardian_contact: formData.guardianContact || null,
    };

    // Close modal immediately and provide instant feedback
    setIsEditModalOpen(false);
    setEditingMember(null);
    toast.success(`Member info for ${memberFullName} updated successfully!`);

    updateMember.mutate(payload, {
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to update member info.');
      },
    });
  };

  const candidateMembersForService = useMemo(() => {
    if (!selectedService) return [];
    return members
      .filter((m) => !selectedService.filter(m))
      .sort((a, b) => {
        const nameA = [a.first_name, a.last_name].filter(Boolean).join(' ');
        const nameB = [b.first_name, b.last_name].filter(Boolean).join(' ');
        return nameA.localeCompare(nameB);
      });
  }, [members, selectedService]);

  const handleAddMemberToService = async () => {
    if (!selectedService || !selectedMemberToAssign) return;
    const memberToAssign = members.find((m) => m.id === selectedMemberToAssign);
    if (!memberToAssign) return;

    const memberName = [memberToAssign.first_name, memberToAssign.last_name].filter(Boolean).join(' ');

    if (selectedService.targetTrack) {
      const track = selectedService.targetTrack;
      updateMember.mutate(
        { id: memberToAssign.id, academic_track: track },
        {
          onSuccess: () => {
            toast.success(`Assigned ${memberName} to ${selectedService.title}`);
            setSelectedMemberToAssign('');
            setIsAddMemberOpen(false);
          },
          onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Failed to assign academic track.');
          },
        }
      );
    } else if (selectedService.targetMinistry) {
      const ministry = selectedService.targetMinistry;
      const currentAssigned = Array.isArray(memberToAssign.assigned_services) ? memberToAssign.assigned_services : [];
      const updated = Array.from(new Set([...currentAssigned, ministry]));
      updateMember.mutate(
        {
          id: memberToAssign.id,
          service: ministry,
          assigned_services: updated,
        },
        {
          onSuccess: () => {
            toast.success(`Added ${memberName} to ${ministry} Ministry`);
            setSelectedMemberToAssign('');
            setIsAddMemberOpen(false);
          },
          onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Failed to assign ministry.');
          },
        }
      );
    } else if (selectedService.targetServantRole) {
      const servantRole = selectedService.targetServantRole;
      updateMember.mutate(
        {
          id: memberToAssign.id,
          service: servantRole,
          assigned_services: [servantRole],
        },
        {
          onSuccess: () => {
            toast.success(`Appointed ${memberName} as ${servantRole}`);
            setSelectedMemberToAssign('');
            setIsAddMemberOpen(false);
          },
          onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Failed to appoint servant.');
          },
        }
      );
    }
  };

  const handleRemoveMemberFromService = async (memberToRemove: Member) => {
    if (!selectedService) return;
    const memberName = [memberToRemove.first_name, memberToRemove.last_name].filter(Boolean).join(' ');

    if (!window.confirm(`Are you sure you want to remove ${memberName} from ${selectedService.title}?`)) {
      return;
    }

    if (selectedService.targetTrack) {
      updateMember.mutate(
        { id: memberToRemove.id, academic_track: null },
        {
          onSuccess: () => toast.success(`Removed ${memberName} from ${selectedService.title}`),
          onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to remove member from track.'),
        }
      );
    } else if (selectedService.targetMinistry) {
      const ministry = selectedService.targetMinistry;
      const currentAssigned = Array.isArray(memberToRemove.assigned_services) ? memberToRemove.assigned_services : [];
      const updated = currentAssigned.filter((s) => s.toLowerCase() !== ministry.toLowerCase());
      const nextService = updated[0] || null;
      updateMember.mutate(
        {
          id: memberToRemove.id,
          service: nextService,
          assigned_services: updated,
        },
        {
          onSuccess: () => toast.success(`Removed ${memberName} from ${ministry} Ministry`),
          onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to remove member from ministry.'),
        }
      );
    } else if (selectedService.targetServantRole) {
      updateMember.mutate(
        {
          id: memberToRemove.id,
          service: null,
          assigned_services: [],
        },
        {
          onSuccess: () => toast.success(`Removed ${memberName} from ${selectedService.title}`),
          onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to remove servant assignment.'),
        }
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight">
              {headerTitle}
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              {serviceCards.length} {serviceCards.length === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal max-w-xl">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* Grid of Role-Specific Service Cards */}
      <div
        className={`grid gap-3 sm:gap-3.5 ${
          serviceCards.length === 1
            ? 'grid-cols-1 max-w-md'
            : serviceCards.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {serviceCards.map((service) => {
          const Icon = service.icon;
          const matchedCount = members.filter(service.filter).length;

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
              className="bg-white dark:bg-[#0e1e36] border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 hover:shadow-xs hover:border-slate-300 dark:hover:border-sky-500/40 active:scale-[0.99] transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky-500/30"
              aria-label={`View details for ${service.title}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-navy/8 dark:bg-sky-500/12 text-navy dark:text-sky-400 border border-navy/10 dark:border-sky-500/20 group-hover:scale-105 transition-transform duration-150">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-navy dark:text-sky-400 px-1.5 py-0.5 rounded-md bg-navy/5 dark:bg-sky-500/10 border border-navy/10 dark:border-sky-500/20 tabular-nums">
                      {matchedCount}
                    </span>
                    {canManageMembers && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setIsAddMemberOpen(true);
                          setSearchQuery('');
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-navy/8 dark:bg-sky-500/15 text-navy dark:text-sky-300 hover:bg-navy hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 transition-colors cursor-pointer min-h-[28px] inline-flex items-center gap-1"
                        aria-label={`Add member to ${service.title}`}
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Add</span>
                      </button>
                    )}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 group-hover:bg-navy group-hover:text-white dark:group-hover:bg-sky-500 dark:group-hover:text-slate-950 transition-colors">
                      View Roster
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading group-hover:text-navy dark:group-hover:text-sky-300 transition-colors">
                  {service.title}
                </h3>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-2 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500 font-medium text-[10.5px] truncate max-w-[140px]">{service.tag}</span>
                <span className="font-semibold text-navy dark:text-sky-400 text-[11px] shrink-0">
                  {matchedCount} {matchedCount === 1 ? service.counterLabel.replace(/s$/, '') : service.counterLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service / Track Members Roster Modal */}
      <Modal
        isOpen={Boolean(selectedService)}
        onClose={() => {
          setSelectedService(null);
          setIsAddMemberOpen(false);
          setSelectedMemberToAssign('');
        }}
        title={selectedService?.title || 'Assigned Members'}
        maxWidth="xl"
      >
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Total matched:{' '}
              <span className="font-bold text-navy dark:text-sky-400">{selectedServiceMembers.length}</span>{' '}
              {selectedServiceMembers.length === 1 ? 'member' : 'members'}
            </p>

            <div className="flex items-center gap-2">
              {canManageMembers && (
                <Button
                  type="button"
                  size="sm"
                  variant={isAddMemberOpen ? 'secondary' : 'primary'}
                  onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                  className="text-xs gap-1.5 h-8 min-h-[36px]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddMemberOpen ? 'Cancel' : 'Add Member'}</span>
                </Button>
              )}

              <div className="relative min-w-[160px] sm:w-56">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="serviceServantSearch"
                  type="text"
                  aria-label="Search members in this track"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, school..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky-500/30 focus:border-navy"
                />
              </div>
            </div>
          </div>

          {canManageMembers && isAddMemberOpen && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Add Member to {selectedService?.title}
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {candidateMembersForService.length} eligible {candidateMembersForService.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {candidateMembersForService.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  All area members are currently assigned to this track or ministry.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedMemberToAssign}
                      onChange={(e) => setSelectedMemberToAssign(e.target.value)}
                      options={[
                        { value: '', label: 'Select a candidate member...' },
                        ...candidateMembersForService.map((m) => {
                          const name = [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ');
                          const currentTrack = m.academic_track || 'No Track';
                          const chapterName = getChapterName(m.chapter_id);
                          return {
                            value: m.id,
                            label: `${name} (${currentTrack} • ${chapterName})`,
                          };
                        }),
                      ]}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!selectedMemberToAssign || updateMember.isPending}
                    isLoading={updateMember.isPending}
                    onClick={handleAddMemberToService}
                    className="sm:self-end h-[44px] min-h-[44px] px-4"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add Member
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            {filteredModalMembers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center">
                <Users className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {searchQuery ? 'No members match your search' : 'No members found'}
                </p>
                <p className="text-slate-400 dark:text-slate-500 mt-0.5 text-[11px]">
                  {searchQuery ? 'Try a different search keyword.' : selectedService?.emptyLabel}
                </p>
              </div>
            ) : (
              filteredModalMembers.map((member: Member) => {
                const memberSchool = (member as Member & { school?: string }).school;
                const memberGrade = (member as Member & { grade_level?: string }).grade_level;

                return (
                  <div
                    key={member.id}
                    className="p-2.5 sm:p-3 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}
                        </p>
                        {member.nickname && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">"{member.nickname}"</span>
                        )}
                        {member.academic_track && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                            {member.academic_track}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {getChapterName(member.chapter_id)}
                        </span>
                        {(memberSchool || memberGrade) && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {[memberSchool, memberGrade].filter(Boolean).join(' / ')}
                            </span>
                          </>
                        )}
                        {member.email && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                              {member.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(member)}
                        className="text-[11px] gap-1 h-7 min-h-[28px] px-2"
                        aria-label={`Edit member info for ${member.first_name}`}
                      >
                        <Edit3 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Edit</span>
                      </Button>
                      {canManageMembers && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveMemberFromService(member)}
                          className="text-[11px] gap-1 h-7 min-h-[28px] px-2"
                          aria-label={`Remove ${member.first_name} from ${selectedService?.title}`}
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Member Info Modal (Allows updating Academic Track, Chapter, School, etc.) */}
      <MemberFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
        }}
        editingMember={editingMember}
        chapters={chapters}
        ministryOptions={ministryOptions}
        onSave={handleSaveMember}
        isSubmitting={updateMember.isPending}
      />
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { useChapters } from '@/hooks/useChapters';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SearchBar } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { UserPlus, Edit2, Trash2, Filter } from 'lucide-react';
import type { Member } from '@/types/member';
import type { Area } from '@/types/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useAreas } from '@/hooks/useDashboard';
import { MemberFormModal, MemberDeleteModal, type MemberFormData } from '@/components/member';

export const MembersPage: React.FC = () => {
  const location = useLocation();
  const { user, activeArea } = useAuthStore();
  const { data: areas = [] } = useAreas();
  const [search, setSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const matchedArea = areas.find((a: Area) => a.id === (activeArea?.id || user?.area_id));
  const effectiveAreaName = activeArea?.name || user?.area_name || matchedArea?.name || (areas.length > 0 ? areas[0].name : 'MFC Youth Area Database');

  const { data: members = [], isLoading } = useMembers();
  const { data: chapters = [] } = useChapters();
  const { data: servicesList = [] } = useServices();
  const toast = useToast();

  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [isModalOpen, setIsModalOpen] = useState(() => Boolean((location.state as { openCreate?: boolean })?.openCreate));
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean })?.openCreate) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const ministryOptions = useMemo(() => {
    const defaultServices = [
      'Music',
      'Dance',
      'Graphics & Promo',
      'Creative Writing',
      'Photography & Videography',
    ];
    const loadedNames = servicesList.map((s) => s.name);
    return Array.from(new Set([...defaultServices, ...loadedNames])).filter(Boolean);
  }, [servicesList]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        m.first_name.toLowerCase().includes(q) ||
        (m.middle_name && m.middle_name.toLowerCase().includes(q)) ||
        m.last_name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        ((m.contact || m.contact_number) && (m.contact || m.contact_number)!.includes(q));

      const matchesChapter = !chapterFilter || m.chapter_id === chapterFilter;
      const matchesTrack = !trackFilter || m.academic_track === trackFilter;
      const matchesStatus = !statusFilter || m.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesService =
        !serviceFilter ||
        (m.service && m.service.toLowerCase() === serviceFilter.toLowerCase()) ||
        (Array.isArray(m.assigned_services) &&
          m.assigned_services.some((s) => s.toLowerCase() === serviceFilter.toLowerCase()));

      return matchesSearch && matchesChapter && matchesTrack && matchesStatus && matchesService;
    });
  }, [members, search, chapterFilter, trackFilter, statusFilter, serviceFilter]);

  const openCreateModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (formData: MemberFormData) => {
    const memberFullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
    try {
      if (editingMember) {
        const payload = {
          id: editingMember.id,
          first_name: formData.firstName,
          middle_name: formData.middleName || null,
          last_name: formData.lastName,
          nickname: formData.nickname,
          gender: formData.gender,
          chapter_id: formData.chapterId || null,
          academic_track: formData.track,
          service: formData.service || null,
          contact: formData.contact,
          contact_number: formData.contact,
          email: formData.email,
          status: formData.status,
          guardian_name: formData.guardianName,
          guardian_contact: formData.guardianContact,
        };

        // Close modal immediately and provide instant visual feedback
        setIsModalOpen(false);
        toast.success('Successful', `Information for ${memberFullName} has been updated.`);

        updateMember.mutate(payload, {
          onError: (err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : 'Failed to save member record.';
            toast.error('Update Failed', errorMsg);
          },
        });
      } else {
        await createMember.mutateAsync({
          first_name: formData.firstName,
          middle_name: formData.middleName || null,
          last_name: formData.lastName,
          nickname: formData.nickname,
          gender: formData.gender,
          chapter_id: formData.chapterId || null,
          academic_track: formData.track,
          service: formData.service || null,
          contact: formData.contact,
          contact_number: formData.contact,
          email: formData.email,
          status: formData.status,
          guardian_name: formData.guardianName,
          guardian_contact: formData.guardianContact,
        });
        setIsModalOpen(false);
        toast.success('Successful', `Member ${memberFullName} has been registered successfully.`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save member record.';
      toast.error('Failed', errorMsg);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      setDeletingId(null);
      toast.success('Successful', 'Member record was removed successfully.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete member.';
      toast.error('Failed', errorMsg);
    }
  };

  const hasActiveFilters = Boolean(search || chapterFilter || trackFilter || statusFilter || serviceFilter);

  const clearAllFilters = () => {
    setSearch('');
    setChapterFilter('');
    setTrackFilter('');
    setStatusFilter('');
    setServiceFilter('');
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header and Action */}
      <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
            Members Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Area Database: <span className="font-semibold text-navy dark:text-sky-400">{effectiveAreaName}</span>
          </p>
        </div>

        <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          <span>Register Member</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone..." />
          </div>

          <Select
            name="chapterFilter"
            aria-label="Filter by chapter"
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            options={[
              { value: '', label: 'All Chapters' },
              ...chapters.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            name="trackFilter"
            aria-label="Filter by academic track"
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            options={[
              { value: '', label: 'All Academic Tracks' },
              { value: 'High School', label: 'High School' },
              { value: 'Senior High School', label: 'Senior High School' },
              { value: 'College', label: 'College' },
              { value: 'Working', label: 'Working' },
            ]}
          />

          <Select
            name="serviceFilter"
            aria-label="Filter by ministry service"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            options={[
              { value: '', label: 'All Ministry Services' },
              ...ministryOptions.map((s) => ({ value: s, label: s })),
            ]}
          />

          <Select
            name="statusFilter"
            aria-label="Filter by member status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Filtered results ({filteredMembers.length} of {members.length} total)
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-navy font-semibold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Data Container */}
      <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-4">
            <TableRowSkeleton columns={6} rows={8} />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No members match your criteria</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting or clearing your search filters to find what you are looking for.'
                : `No members registered yet in ${effectiveAreaName}. Add your first member to get started.`}
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" size="sm" onClick={clearAllFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-700 border-b border-border-subtle">
                  <tr>
                    <th className="px-5 py-3.5">Member</th>
                    <th className="px-5 py-3.5">Track</th>
                    <th className="px-5 py-3.5">Chapter</th>
                    <th className="px-5 py-3.5">Ministry Service</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors duration-150 group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy/10 dark:bg-sky-500/15 text-navy dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 border border-navy/15 dark:border-sky-500/30 shadow-2xs group-hover:scale-105 transition-transform duration-150">
                            {member.first_name ? member.first_name[0].toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-navy dark:group-hover:text-sky-300 transition-colors">
                              {[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}
                            </div>
                            {member.nickname && (
                              <div className="text-xs text-slate-500">"{member.nickname}"</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {member.academic_track || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {member.chapter_name ||
                          chapters.find((c) => c.id === member.chapter_id)?.name ||
                          'Unassigned'}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium">
                        {member.service || (member.assigned_services && member.assigned_services[0]) ? (
                          <Badge variant="navy">{member.service || member.assigned_services![0]}</Badge>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{member.contact || member.contact_number || '-'}</div>
                        <div className="text-[11px] text-slate-400">{member.email || ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={member.status?.toLowerCase() === 'active' ? 'success' : 'default'}>
                          {member.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="p-2 text-slate-500 hover:text-navy dark:hover:text-sky-300 active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                            aria-label={`Edit ${[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(member.id)}
                            className="p-2 text-slate-500 hover:text-mfc-red active:scale-95 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-150 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                            aria-label={`Delete ${[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border-subtle p-3 space-y-3">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 bg-slate-50/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 card-interactive">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-navy/10 dark:bg-sky-500/15 text-navy dark:text-sky-400 font-bold text-sm flex items-center justify-center shrink-0 border border-navy/15 dark:border-sky-500/30 shadow-2xs">
                        {member.first_name ? member.first_name[0].toUpperCase() : 'M'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')}
                        </div>
                        {member.nickname && (
                          <div className="text-xs text-slate-500">"{member.nickname}"</div>
                        )}
                      </div>
                    </div>
                    <Badge variant={member.status?.toLowerCase() === 'active' ? 'success' : 'default'}>
                      {member.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                      {member.academic_track || 'Track unassigned'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                      {member.chapter_name || chapters.find((c) => c.id === member.chapter_id)?.name || 'No chapter'}
                    </span>
                    {(member.service || (member.assigned_services && member.assigned_services[0])) && (
                      <Badge variant="navy">
                        {member.service || member.assigned_services![0]}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/70 space-y-0.5">
                    <div>Phone: <strong className="text-slate-800">{member.contact || member.contact_number || 'N/A'}</strong></div>
                    {member.email && <div className="text-slate-500 truncate">{member.email}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(member)}
                      className="w-full flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-navy" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingId(member.id)}
                      className="w-full flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      <MemberFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingMember={editingMember}
        chapters={chapters}
        ministryOptions={ministryOptions}
        onSave={handleSaveMember}
        isSubmitting={createMember.isPending || updateMember.isPending}
      />

      {/* Delete Confirmation Modal */}
      <MemberDeleteModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        isDeleting={deleteMember.isPending}
      />
    </div>
  );
};

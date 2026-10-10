import React, { useState, useMemo } from 'react';
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { useChapters } from '@/hooks/useChapters';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchBar } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { UserPlus, Edit2, Trash2, Filter, AlertTriangle } from 'lucide-react';
import type { Member, AcademicTrack, MemberStatus } from '@/types/member';

export const MembersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const { data: members = [], isLoading } = useMembers();
  const { data: chapters = [] } = useChapters();
  const { data: servicesList = [] } = useServices();

  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [chapterId, setChapterId] = useState('');
  const [track, setTrack] = useState<AcademicTrack>('College');
  const [service, setService] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<MemberStatus>('active');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [formError, setFormError] = useState('');

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
    setFirstName('');
    setLastName('');
    setNickname('');
    setGender('Male');
    setChapterId(chapters[0]?.id || '');
    setTrack('College');
    setService('');
    setContact('');
    setEmail('');
    setStatus('active');
    setGuardianName('');
    setGuardianContact('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFirstName(member.first_name);
    setLastName(member.last_name);
    setNickname(member.nickname || '');
    setGender(member.gender === 'Female' ? 'Female' : 'Male');
    setChapterId(member.chapter_id || '');
    setTrack(member.academic_track || 'College');
    setService(member.service || (member.assigned_services && member.assigned_services[0]) || '');
    setContact(member.contact || member.contact_number || '');
    setEmail(member.email || '');
    setStatus(member.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active');
    setGuardianName(member.guardian_name || '');
    setGuardianContact(member.guardian_contact || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and last name are required.');
      return;
    }

    try {
      if (editingMember) {
        await updateMember.mutateAsync({
          id: editingMember.id,
          first_name: firstName,
          last_name: lastName,
          nickname,
          gender,
          chapter_id: chapterId || null,
          academic_track: track,
          service: service || null,
          contact,
          email,
          status,
          guardian_name: guardianName,
          guardian_contact: guardianContact,
        });
      } else {
        await createMember.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          nickname,
          gender,
          chapter_id: chapterId || null,
          academic_track: track,
          service: service || null,
          contact,
          email,
          status,
          guardian_name: guardianName,
          guardian_contact: guardianContact,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to save member record.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      setDeletingId(null);
    } catch {
      alert('Failed to delete member.');
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
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Members Directory
            </h1>
            <Badge variant="navy">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'Record' : 'Records'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Manage youth rosters, pastoral contacts, and ministry track assignments.
          </p>
        </div>

        <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          <span>Register Member</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone..." />
          </div>

          <Select
            name="chapterFilter"
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            options={[
              { value: '', label: 'All Chapters' },
              ...chapters.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            name="trackFilter"
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
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            options={[
              { value: '', label: 'All Ministry Services' },
              ...ministryOptions.map((s) => ({ value: s, label: s })),
            ]}
          />

          <Select
            name="statusFilter"
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
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-xs text-slate-500 font-medium">Loading members list...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No members match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting or clearing your search filters to find what you are looking for.'
                : 'No members registered yet in this roster. Add your first member to get started.'}
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
                <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase border-b border-border-subtle tracking-wider">
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
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy/10 text-navy font-bold text-xs flex items-center justify-center shrink-0 border border-navy/15 shadow-2xs">
                            {member.first_name ? member.first_name[0].toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {member.first_name} {member.last_name}
                            </div>
                            {member.nickname && (
                              <div className="text-xs text-slate-500">"{member.nickname}"</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {member.academic_track || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
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
                      <td className="px-5 py-4 text-xs text-slate-600">
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
                            className="p-2 text-slate-500 hover:text-navy rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                            aria-label={`Edit ${member.first_name} ${member.last_name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(member.id)}
                            className="p-2 text-slate-500 hover:text-mfc-red rounded-lg hover:bg-rose-50 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                            aria-label={`Delete ${member.first_name} ${member.last_name}`}
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
                <div key={member.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-navy/10 text-navy font-bold text-sm flex items-center justify-center shrink-0 border border-navy/15 shadow-2xs">
                        {member.first_name ? member.first_name[0].toUpperCase() : 'M'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {member.first_name} {member.last_name}
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Member Record' : 'Register New Member'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nickname"
              name="nickname"
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Select
              label="Gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Chapter"
              name="chapterId"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...chapters.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Academic Track"
              name="academicTrack"
              value={track}
              onChange={(e) => setTrack(e.target.value as AcademicTrack)}
              options={[
                { value: 'High School', label: 'High School' },
                { value: 'Senior High School', label: 'Senior High School' },
                { value: 'College', label: 'College' },
                { value: 'Working', label: 'Working' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Ministry Service Track"
              name="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              options={[
                { value: '', label: 'Unassigned / None' },
                ...ministryOptions.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              label="Membership Status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mobile Number"
              name="contact"
              autoComplete="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="09123456789"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Guardian Name"
              name="guardianName"
              autoComplete="name"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Parent or Guardian"
            />
            <Input
              label="Guardian Contact"
              name="guardianContact"
              autoComplete="tel"
              value={guardianContact}
              onChange={(e) => setGuardianContact(e.target.value)}
              placeholder="Emergency phone number"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMember.isPending || updateMember.isPending}
            >
              {editingMember ? 'Save Changes' : 'Register Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Confirm Member Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 text-mfc-red rounded-lg">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs">
              Are you sure you want to permanently delete this member record? This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMember.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

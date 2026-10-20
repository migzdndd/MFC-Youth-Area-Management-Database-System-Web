import React, { useState } from 'react';
import { useChapters, useCreateChapter, useDeleteChapter } from '@/hooks/useChapters';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Building2, Plus, Users, Trash2, User } from 'lucide-react';
import type { Chapter } from '@/types/chapter';

export const ChaptersPage: React.FC = () => {
  const { data: chapters = [], isLoading } = useChapters();
  const { data: members = [] } = useMembers();

  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChapterForMembers, setSelectedChapterForMembers] = useState<Chapter | null>(null);
  const [name, setName] = useState('');
  const [headMemberId, setHeadMemberId] = useState('');
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setName('');
    setHeadMemberId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Chapter name is required.');
      return;
    }

    try {
      await createChapter.mutateAsync({
        name: name.trim(),
        head_member_id: headMemberId || null,
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create chapter.');
      }
    }
  };

  const handleDelete = async (chapter: Chapter) => {
    if (!window.confirm(`Are you sure you want to delete chapter "${chapter.name}"?`)) {
      return;
    }
    try {
      await deleteChapter.mutateAsync(chapter.id);
    } catch {
      alert('Failed to delete chapter.');
    }
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
            Chapters
          </h1>
        </div>

        <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </Button>
      </div>

      {/* Chapters Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading chapters...</span>
        </div>
      ) : chapters.length === 0 ? (
        <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center shadow-2xs">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No chapters established</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first area chapter to start organizing households and community members.
          </p>
          <Button onClick={openCreateModal} className="mt-4" size="sm">
            Add First Chapter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => {
            const chapterMembers = members.filter((m) => m.chapter_id === chapter.id);
            const headMember = members.find((m) => m.id === chapter.head_member_id);

            return (
              <div
                key={chapter.id}
                onClick={() => setSelectedChapterForMembers(chapter)}
                className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-sky-500/40 transition-all duration-200 flex flex-col justify-between group cursor-pointer card-interactive"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-navy/10 dark:bg-sky-500/15 text-navy dark:text-sky-400 border border-transparent dark:border-sky-500/20 group-hover:scale-105 transition-transform duration-150">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base font-heading group-hover:text-navy dark:group-hover:text-sky-300 transition-colors">
                        {chapter.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(chapter);
                      }}
                      className="p-2 text-slate-400 hover:text-mfc-red dark:hover:text-rose-400 active:scale-95 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-150 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label={`Delete chapter ${chapter.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 py-2 bg-slate-50/70 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/70 dark:border-sky-500/15">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-navy dark:text-sky-400 shrink-0" />
                      <span className="truncate">
                        Head:{' '}
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {headMember
                            ? [headMember.first_name, headMember.middle_name, headMember.last_name].filter(Boolean).join(' ')
                            : 'Not assigned'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        Youth Roster:{' '}
                        <strong className="text-slate-900 dark:text-white font-semibold">{chapterMembers.length} members</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="text-navy dark:text-sky-400 font-medium group-hover:underline">Click to view members &rarr;</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter Members Roster Modal */}
      <Modal
        isOpen={!!selectedChapterForMembers}
        onClose={() => setSelectedChapterForMembers(null)}
        title={selectedChapterForMembers ? `${selectedChapterForMembers.name} - Assigned Members` : 'Chapter Members'}
        maxWidth="xl"
      >
        {selectedChapterForMembers && (() => {
          const assignedMembers = members.filter((m) => m.chapter_id === selectedChapterForMembers.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Roster of youth assigned to {selectedChapterForMembers.name}
                </span>
                <Badge variant="navy">
                  {assignedMembers.length} {assignedMembers.length === 1 ? 'Member' : 'Members'}
                </Badge>
              </div>

              {assignedMembers.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  No members are currently assigned to this chapter.
                </div>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100 pr-1">
                  {assignedMembers.map((m) => (
                    <div
                      key={m.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {[m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')}
                          {m.nickname && (
                            <span className="text-xs font-normal text-slate-500 ml-1.5">
                              &ldquo;{m.nickname}&rdquo;
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2 items-center">
                          <span>{m.contact || m.contact_number || 'No phone'}</span>
                          {m.email && (
                            <>
                              <span>&bull;</span>
                              <span>{m.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {m.academic_track || 'Member'}
                        </span>
                        {m.service && (
                          <Badge variant="navy">{m.service}</Badge>
                        )}
                        <Badge variant={m.status?.toLowerCase() === 'active' ? 'success' : 'default'}>
                          {m.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button variant="secondary" onClick={() => setSelectedChapterForMembers(null)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Add Chapter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Chapter"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
              {formError}
            </div>
          )}

          <Input
            label="Chapter Name"
            required
            placeholder="e.g. Chapter 1 - East Sector"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            label="Designated Chapter Head"
            value={headMemberId}
            onChange={(e) => setHeadMemberId(e.target.value)}
            options={[
              { value: '', label: 'Select Chapter Head (Optional)' },
              ...members.map((m) => ({
                value: m.id,
                label: `${[m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')} (${m.academic_track || 'Member'})`,
              })),
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createChapter.isPending}>
              Create Chapter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

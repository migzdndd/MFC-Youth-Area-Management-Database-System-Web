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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Chapters & Households
            </h1>
            <Badge variant="navy">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Manage geographic chapters, servant heads, and pastoral cell groups.
          </p>
        </div>

        <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </Button>
      </div>

      {/* Chapters Grid */}
      {isLoading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500 font-medium">Loading chapters...</span>
        </div>
      ) : chapters.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No chapters established</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-navy/10 text-navy group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base font-heading group-hover:text-navy transition-colors">
                        {chapter.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(chapter)}
                      className="p-2 text-slate-400 hover:text-mfc-red rounded-lg hover:bg-rose-50 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label={`Delete chapter ${chapter.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 py-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-navy shrink-0" />
                      <span className="truncate">
                        Head:{' '}
                        <strong className="text-slate-900 font-semibold">
                          {headMember
                            ? `${headMember.first_name} ${headMember.last_name}`
                            : 'Not assigned'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Youth Roster:{' '}
                        <strong className="text-slate-900 font-semibold">{chapterMembers.length} members</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>Geographic Chapter</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                label: `${m.first_name} ${m.last_name} (${m.academic_track || 'Member'})`,
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

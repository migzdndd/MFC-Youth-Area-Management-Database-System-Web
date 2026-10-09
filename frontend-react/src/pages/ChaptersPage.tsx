import React, { useState } from 'react';
import { useChapters, useCreateChapter, useDeleteChapter } from '@/hooks/useChapters';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Chapters & Households
          </h1>
          <p className="text-sm text-text-muted">
            Manage geographic chapters, servant heads, and cell groups.
          </p>
        </div>

        <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </Button>
      </div>

      {/* Chapters Grid */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-text-muted">Loading chapters...</span>
        </div>
      ) : chapters.length === 0 ? (
        <div className="bg-white border border-border-subtle rounded-xl p-12 text-center">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-text-main">No chapters established</h3>
          <p className="text-xs text-text-muted mt-1">
            Create your first area chapter to start organizing households and members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => {
            const chapterMembers = members.filter((m) => m.chapter_id === chapter.id);
            const headMember = members.find((m) => m.id === chapter.head_member_id);

            return (
              <div
                key={chapter.id}
                className="bg-white border border-border-subtle rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-navy/10 text-navy">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-text-main text-base font-heading">
                        {chapter.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(chapter)}
                      className="p-1.5 text-slate-400 hover:text-mfc-red rounded hover:bg-red-50 transition-colors"
                      aria-label={`Delete chapter ${chapter.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Head:{' '}
                        <strong className="text-text-main">
                          {headMember
                            ? `${headMember.first_name} ${headMember.last_name}`
                            : 'Not assigned'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Registered Members:{' '}
                        <strong className="text-text-main">{chapterMembers.length}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border-subtle text-xs text-slate-400 flex items-center justify-between">
                  <span>Geographic Chapter</span>
                  <span className="font-semibold text-navy">Active</span>
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

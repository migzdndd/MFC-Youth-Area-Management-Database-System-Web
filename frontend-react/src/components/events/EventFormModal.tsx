import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';
import type { CommunityEvent } from '@/types/event';
import { formatForDateTimeInput } from './event-utils';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: CommunityEvent | null;
  onSave: (payload: {
    name: string;
    starts_at: string;
    venue: string;
    fee: number;
    description: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

interface EventFormContentProps {
  editingEvent: CommunityEvent | null;
  onSave: (payload: {
    name: string;
    starts_at: string;
    venue: string;
    fee: number;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

const EventFormContent: React.FC<EventFormContentProps> = ({
  editingEvent,
  onSave,
  onClose,
  isSubmitting,
}) => {
  const [name, setName] = useState(editingEvent ? editingEvent.name : '');
  const [startsAt, setStartsAt] = useState(
    editingEvent ? formatForDateTimeInput(editingEvent.starts_at) : ''
  );
  const [venue, setVenue] = useState(editingEvent?.venue || '');
  const [fee, setFee] = useState(String(editingEvent?.fee ?? 0));
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Event Name is required.');
      return;
    }
    if (!startsAt.trim()) {
      setFormError('Date & Time is required.');
      return;
    }
    if (!venue.trim()) {
      setFormError('Venue Location is required.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        starts_at: startsAt,
        venue: venue.trim(),
        fee: parseFloat(fee) || 0,
        description: description.trim(),
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(
          editingEvent ? 'Failed to update event.' : 'Failed to schedule event.'
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <Input
        label="Event Name"
        name="eventName"
        required
        placeholder="e.g. Monthly Chapter Assembly"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label="Date & Time"
        name="eventSchedule"
        type="datetime-local"
        required
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
      />

      <Input
        label="Venue Location"
        name="eventVenue"
        required
        placeholder="Parish Hall / Camp Site"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
      />

      <Input
        label="Registration Fee (PHP)"
        name="eventFee"
        type="number"
        min="0"
        step="1"
        placeholder="0 for Free"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
      />

      <div className="w-full flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-800">
          Description / Agenda (Optional)
        </label>
        <textarea
          rows={3}
          className="w-full px-3.5 py-2.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
          placeholder="Event details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {editingEvent ? 'Save Changes' : 'Schedule Event'}
        </Button>
      </div>
    </form>
  );
};

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  editingEvent,
  onSave,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEvent ? 'Edit Community Event' : 'Schedule Community Event'}
      maxWidth="md"
    >
      {isOpen && (
        <EventFormContent
          key={editingEvent ? editingEvent.id : 'create'}
          editingEvent={editingEvent}
          onSave={onSave}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
      )}
    </Modal>
  );
};

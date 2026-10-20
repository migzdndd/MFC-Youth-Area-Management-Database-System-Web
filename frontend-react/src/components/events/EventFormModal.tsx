import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  FileText,
} from 'lucide-react';
import type { CommunityEvent } from '@/types/event';
import {
  formatForDateTimeInput,
  serializeDescription,
  parseDescription,
  EVENT_CATEGORIES,
  TARGET_TRACK_OPTIONS,
  DRESS_CODE_OPTIONS,
} from './event-utils';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: CommunityEvent | null;
  onSave: (payload: {
    name: string;
    starts_at: string;
    ends_at?: string | null;
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
    ends_at?: string | null;
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
  const initialData = useMemo(() => {
    if (!editingEvent) {
      return {
        name: '',
        startsAt: '',
        endsAt: '',
        venue: '',
        fee: '0',
        mainDescription: '',
        category: 'Chapter Assembly',
        targetTrack: 'All Demographic Tracks',
        targetHeadcount: '',
        secretariatLead: '',
        secretariatContact: '',
        registrationDeadline: '',
        dressCode: 'Community Shirt / Blue Shirt',
        thingsToBring: '',
        secretariatNotes: '',
      };
    }

    const { mainDescription, meta } = parseDescription(editingEvent.description);

    return {
      name: editingEvent.name,
      startsAt: formatForDateTimeInput(editingEvent.starts_at),
      endsAt: formatForDateTimeInput(editingEvent.ends_at),
      venue: editingEvent.venue || '',
      fee: String(editingEvent.fee ?? 0),
      mainDescription,
      category: meta.category || 'Chapter Assembly',
      targetTrack: meta.targetTrack || 'All Demographic Tracks',
      targetHeadcount: meta.targetHeadcount || '',
      secretariatLead: meta.secretariatLead || '',
      secretariatContact: meta.secretariatContact || '',
      registrationDeadline: meta.registrationDeadline || '',
      dressCode: meta.dressCode || 'Community Shirt / Blue Shirt',
      thingsToBring: meta.thingsToBring || '',
      secretariatNotes: meta.secretariatNotes || '',
    };
  }, [editingEvent]);

  // Primary Event Details
  const [name, setName] = useState(initialData.name);
  const [startsAt, setStartsAt] = useState(initialData.startsAt);
  const [endsAt, setEndsAt] = useState(initialData.endsAt);
  const [venue, setVenue] = useState(initialData.venue);
  const [fee, setFee] = useState(initialData.fee);

  // Secretariat & Logistics Fields (No DB Schema modification needed)
  const [category, setCategory] = useState(initialData.category);
  const [targetTrack, setTargetTrack] = useState(initialData.targetTrack);
  const [targetHeadcount, setTargetHeadcount] = useState(initialData.targetHeadcount);
  const [secretariatLead, setSecretariatLead] = useState(initialData.secretariatLead);
  const [secretariatContact, setSecretariatContact] = useState(initialData.secretariatContact);
  const [registrationDeadline, setRegistrationDeadline] = useState(initialData.registrationDeadline);
  const [dressCode, setDressCode] = useState(initialData.dressCode);
  const [thingsToBring, setThingsToBring] = useState(initialData.thingsToBring);
  const [secretariatNotes, setSecretariatNotes] = useState(initialData.secretariatNotes);

  // General Agenda
  const [mainDescription, setMainDescription] = useState(initialData.mainDescription);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Event Name is required.');
      return;
    }
    if (!startsAt.trim()) {
      setFormError('Starting Date & Time is required.');
      return;
    }
    if (!venue.trim()) {
      setFormError('Venue Location is required.');
      return;
    }

    if (endsAt.trim()) {
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);
      if (endDate.getTime() < startDate.getTime()) {
        setFormError('Conclusion date/time cannot be earlier than start date/time.');
        return;
      }
    }

    const compiledDescription = serializeDescription(mainDescription, {
      category,
      targetTrack,
      targetHeadcount,
      secretariatLead,
      secretariatContact,
      registrationDeadline,
      dressCode,
      thingsToBring,
      secretariatNotes,
    });

    try {
      await onSave({
        name: name.trim(),
        starts_at: startsAt,
        ends_at: endsAt.trim() || null,
        venue: venue.trim(),
        fee: parseFloat(fee) || 0,
        description: compiledDescription,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: Gathering Identity & Venue */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-navy dark:text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Gathering Schedule & Venue
          </span>
        </div>

        <Input
          label="Event Name"
          name="eventName"
          required
          placeholder="e.g. Monthly Chapter Assembly 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Starts At (Date & Time)"
            name="eventStartsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />

          <Input
            label="Ends At (Optional Conclusion Time)"
            name="eventEndsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            helperText="Leave empty if single-session or self-paced."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Venue Location"
            name="eventVenue"
            required
            placeholder="Parish Hall / Retreat Camp"
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
        </div>
      </div>

      {/* SECTION 2: Secretariat & Operations Briefing (Local Secretariat Needs) */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3.5">
        <div className="flex items-start justify-between gap-2 pb-1 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Secretariat & Operations Briefing
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Logistical details for chapter registration desks and attendance officers.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
            Desk Ops
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Event Category / Type"
            name="eventCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={EVENT_CATEGORIES}
          />

          <Select
            label="Target Demographic Track"
            name="targetTrack"
            value={targetTrack}
            onChange={(e) => setTargetTrack(e.target.value)}
            options={TARGET_TRACK_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Secretariat Lead / Point Person"
            name="secretariatLead"
            placeholder="e.g. Maria Clara Santos"
            value={secretariatLead}
            onChange={(e) => setSecretariatLead(e.target.value)}
          />

          <Input
            label="Secretariat Contact / Hotlines"
            name="secretariatContact"
            placeholder="e.g. +63 917 123 4567 / secretary@chapter.mfc"
            value={secretariatContact}
            onChange={(e) => setSecretariatContact(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Target Capacity / Headcount"
            name="targetHeadcount"
            type="number"
            min="0"
            placeholder="e.g. 75 participants"
            value={targetHeadcount}
            onChange={(e) => setTargetHeadcount(e.target.value)}
          />

          <Input
            label="Registration Deadline / Cutoff"
            name="registrationDeadline"
            placeholder="e.g. Nov 15, 2026, 6:00 PM"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Attire / Dress Code"
            name="dressCode"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            options={DRESS_CODE_OPTIONS}
          />

          <Input
            label="Things to Bring / Packing List"
            name="thingsToBring"
            placeholder="e.g. Bible, Rosary, Notebook, Water Bottle"
            value={thingsToBring}
            onChange={(e) => setThingsToBring(e.target.value)}
          />
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <label htmlFor="secretariatNotes" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Secretariat Internal Logistics & Notes
          </label>
          <textarea
            id="secretariatNotes"
            rows={2}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky-500/20 focus:border-navy dark:focus:border-sky-400 placeholder:text-slate-400"
            placeholder="e.g. Set up registration tables at church foyer; prepare 80 printed ID badges; cashbox for manual registration fee collections."
            value={secretariatNotes}
            onChange={(e) => setSecretariatNotes(e.target.value)}
          />
        </div>
      </div>

      {/* SECTION 3: General Agenda / Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <FileText className="w-4 h-4 text-navy dark:text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Program Agenda & Public Description
          </span>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <label htmlFor="eventDescription" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Detailed program flow, praise & worship sequence, or speaker topics:
          </label>
          <textarea
            id="eventDescription"
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky-500/20 focus:border-navy dark:focus:border-sky-400 placeholder:text-slate-400"
            placeholder="1:00 PM Praise & Worship&#10;2:00 PM Session 1&#10;3:30 PM Group Sharing&#10;4:30 PM Closing Assembly..."
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose} className="min-h-[44px]">
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} className="min-h-[44px]">
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
      description="Define gathering parameters, schedule, venue, and secretariat desk requirements."
      maxWidth="xl"
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

